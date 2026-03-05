export enum EmotionType {
  ANXIETY = 'anxiety',
  SADNESS = 'sadness',
  JOY = 'joy',
  CALM = 'calm',
  IRRITATION = 'irritation',
  FEAR = 'fear',
  SHAME = 'shame',
  PRIDE = 'pride',
}

export interface MoodEntry {
  id: string;
  userId: string;
  value: number;
  emotions: EmotionType[];
  note?: string;
  conversationId?: string;
  createdAt: string;
}

export interface MoodStats {
  average: number;
  trend: 'improving' | 'declining' | 'stable';
  totalEntries: number;
  streak: number;
}
