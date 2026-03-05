import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateMoodDto } from './dto/create-mood.dto';
import { UpdateMoodDto } from './dto/update-mood.dto';
import { Mood } from './mood.entity';

@Injectable()
export class MoodService {
  constructor(
    @InjectRepository(Mood)
    private readonly moodRepo: Repository<Mood>,
  ) {}

  async create(userId: string, dto: CreateMoodDto): Promise<Mood> {
    return this.moodRepo.save(
      this.moodRepo.create({
        userId,
        value: dto.value,
        emotions: dto.emotions ?? [],
        note: dto.note ?? null,
        sessionId: dto.sessionId ?? null,
      }),
    );
  }

  async findByUser(userId: string, from?: string, to?: string): Promise<Mood[]> {
    const qb = this.moodRepo
      .createQueryBuilder('m')
      .where('m.userId = :userId', { userId })
      .orderBy('m.createdAt', 'DESC');

    if (from) qb.andWhere('m.createdAt >= :from', { from });
    if (to) qb.andWhere('m.createdAt <= :to', { to });

    return qb.take(100).getMany();
  }

  async getStats(
    userId: string,
  ): Promise<{ average: number; trend: string; totalEntries: number; streak: number }> {
    const moods = await this.findByUser(userId);

    if (!moods.length) {
      return { average: 0, trend: 'stable', totalEntries: 0, streak: 0 };
    }

    const average = +(moods.reduce((s, m) => s + m.value, 0) / moods.length).toFixed(1);

    const now = Date.now();
    const week = 7 * 86400000;
    const recent = moods.filter((m) => new Date(m.createdAt).getTime() > now - week);
    const prev = moods.filter((m) => {
      const t = new Date(m.createdAt).getTime();
      return t > now - 2 * week && t <= now - week;
    });

    const rAvg = recent.length ? recent.reduce((s, m) => s + m.value, 0) / recent.length : average;
    const pAvg = prev.length ? prev.reduce((s, m) => s + m.value, 0) / prev.length : average;
    const diff = rAvg - pAvg;
    const trend = diff > 0.5 ? 'improving' : diff < -0.5 ? 'declining' : 'stable';

    const daySet = new Set(moods.map((m) => new Date(m.createdAt).toISOString().slice(0, 10)));
    let streak = 0;
    const d = new Date();
    while (daySet.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    return { average, trend, totalEntries: moods.length, streak };
  }

  async getEmotionDistribution(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<{ emotion: string; count: number }[]> {
    const moods = await this.findByUser(userId, from, to);
    const counts: Record<string, number> = {};

    for (const m of moods) {
      for (const e of m.emotions ?? []) {
        counts[e] = (counts[e] ?? 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);
  }

  async update(id: string, userId: string, dto: UpdateMoodDto): Promise<Mood> {
    const mood = await this.moodRepo.findOne({ where: { id, userId } });
    if (!mood) throw new NotFoundException('Mood entry not found');
    Object.assign(mood, dto);
    return this.moodRepo.save(mood);
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.moodRepo.delete({ id, userId });
    if (!result.affected) throw new NotFoundException('Mood entry not found');
  }
}
