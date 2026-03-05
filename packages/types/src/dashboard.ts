import type { EmotionType, MoodEntry, MoodStats } from './mood';
import type { PatientListItem } from './therapist';

export interface SessionAnalysis {
  id: string;
  conversationId: string;
  userId: string;
  anxietyLevel: number;
  depressionLevel: number;
  keyEmotions: EmotionType[];
  keyTopics: string[];
  copingStrategies: string[];
  riskFlags: string | null;
  insight: string;
  createdAt: string;
}

export interface PatientDashboardData {
  moodHistory: MoodEntry[];
  moodStats: MoodStats;
  recentAnalyses: SessionAnalysis[];
  weeklyInsight: string | null;
  sessionsCount: number;
  topTopics: { topic: string; count: number }[];
  topEmotions: { emotion: EmotionType; count: number }[];
}

export interface TherapistDashboardData {
  patients: PatientListItem[];
  totalPatients: number;
  patientsNeedingAttention: number;
  upcomingSessions: number;
}
