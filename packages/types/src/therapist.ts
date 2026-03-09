export enum PatientStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum RiskLevel {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
}

export enum ReportStatus {
  GENERATING = 'generating',
  READY = 'ready',
  ERROR = 'error',
}

export interface PatientTherapistLink {
  id: string;
  therapistId: string;
  patientId: string;
  status: PatientStatus;
  inviteCode?: string;
  connectedAt?: string;
  createdAt: string;
}

export interface PatientListItem {
  id: string;
  name: string;
  email: string;
  status: PatientStatus;
  lastActivity: string | null;
  avgMood: number | null;
  anxietyLevel: number | null;
  depressionLevel: number | null;
  sessionsCount: number;
  nextSession?: string;
}

export interface ReportContent {
  summary: string;
  moodTrend: string;
  keyThemes: string[];
  concerns: string[];
  copingStrategiesUsed: string[];
  progressNotes: string;
  suggestedFocus: string;
  riskFlags: string | null;
}

export interface TherapistReport {
  id: string;
  therapistId: string;
  patientId: string;
  status: ReportStatus;
  periodStart: string;
  periodEnd: string;
  content?: ReportContent;
  errorMessage?: string | null;
  createdAt: string;
}

export interface PatientSummary {
  linkId: string;
  linkStatus: 'pending' | 'active' | 'inactive';
  patient: { id: string; email: string; name: string | null };
  avgMood: number | null;
  anxietyLevel: number | null;
  depressionLevel: number | null;
  riskFlags: string | null;
  statusColor: 'red' | 'yellow' | 'green';
  connectedAt: string | null;
  lastActivity: string | null;
}

export interface ProfileAnalysis {
  id: string;
  sessionId: string;
  anxietyLevel: number | null;
  depressionLevel: number | null;
  keyEmotions: string[] | null;
  keyTopics: string[] | null;
  copingStrategies: string[] | null;
  riskFlags: string | null;
  moodInsight: string | null;
  therapistBrief: string | null;
  createdAt: string;
}

export interface PatientProfileData {
  patient: { id: string; email: string; name: string | null };
  linkStatus: string;
  connectedAt: string | null;
  moodStats: { avgMood: number | null; totalEntries: number };
  moods: Array<{ id: string; userId: string; value: number; emotions: string[]; note?: string; createdAt: string }>;
  analyses: ProfileAnalysis[];
  emotionDistribution: Array<{ emotion: string; count: number }>;
}
