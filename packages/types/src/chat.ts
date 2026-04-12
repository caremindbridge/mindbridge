export enum SessionStatus {
  Active = 'active',
  Ended = 'ended',
  Analyzing = 'analyzing',
  Completed = 'completed',
}

export enum SessionCategory {
  CBT = 'cbt',
  Interpersonal = 'interpersonal',
  Mindfulness = 'mindfulness',
  Wellness = 'wellness',
}

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system',
}

export interface MessageDto {
  id: string;
  role: MessageRole;
  content: string;
  sessionId: string;
  orderIndex: number;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  status: SessionStatus;
  title: string | null;
  category: SessionCategory | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  analysis?: {
    anxietyLevel: number | null;
    depressionLevel: number | null;
    moodOutcome: string | null;
    shortSummary: string | null;
  } | null;
}

export interface SessionWithMessagesDto extends SessionDto {
  messages: MessageDto[];
}

export interface CognitiveDistortionDto {
  type: string;
  description: string;
  example: string;
  frequency: string;
}

export interface EmotionalTrackPointDto {
  moment: string;
  emotion: string;
  intensity: number;
  trigger: string;
}

export interface SessionAnalysisDto {
  id: string;
  sessionId: string;
  cognitiveDistortions: CognitiveDistortionDto[];
  emotionalTrack: EmotionalTrackPointDto[];
  themes: string[];
  triggers: string[];
  progressSummary: string;
  recommendations: string[];
  homework: string[] | null;
  therapistBrief: string;
  moodInsight?: string | null;
  patientSummary?: string | null;
  category?: SessionCategory | null;
  moodOutcome?: string | null;
  createdAt: string;
}

export interface SendMessageDto {
  content: string;
}

export interface ChatStreamEvent {
  type: 'token' | 'message_complete' | 'analysis_ready' | 'error' | 'keepalive';
  data?: string;
  messageId?: string;
  analysisId?: string;
}

export interface PaginatedSessionsDto {
  sessions: SessionDto[];
  total: number;
  page: number;
  limit: number;
}
