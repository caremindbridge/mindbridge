import type { AuthResponse, LoginDto, RegisterDto } from '@mindbridge/types/src/auth';
import type {
  PaginatedSessionsDto,
  SessionAnalysisDto,
  SessionWithMessagesDto,
} from '@mindbridge/types/src/chat';
import type { MoodEntry, MoodStats } from '@mindbridge/types/src/mood';
import type {
  MyProfileDto,
  PatientContextData,
  PatientDossierResponse,
  UpdateTherapistNotesRequest,
} from '@mindbridge/types/src/profile';
import type {
  PatientProfileData,
  PatientSummary,
  TherapistReport,
} from '@mindbridge/types/src/therapist';
import type { UserDto } from '@mindbridge/types/src/user';
import Cookies from 'js-cookie';

import { env } from '@/shared/config/env';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = Cookies.get('token');
  const locale = Cookies.get('locale') ?? 'en';
  const headers: Record<string, string> = { 'x-locale': locale };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/dashboard')
    ) {
      Cookies.remove('token');
      window.location.href = '/login';
      return new Promise<T>(() => {});
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: string }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${env.apiUrl}/api${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${env.apiUrl}/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${env.apiUrl}/api${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${env.apiUrl}/api${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${env.apiUrl}/api${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },
};

export async function login(dto: LoginDto): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', dto);
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', dto);
}

export async function getMe(): Promise<UserDto> {
  return apiClient.get<UserDto>('/auth/me');
}

export async function updateProfile(data: { name?: string }): Promise<UserDto> {
  return apiClient.patch<UserDto>('/auth/me', data);
}

export async function switchMode(mode: 'therapist' | 'patient'): Promise<{ activeMode: string }> {
  return apiClient.patch<{ activeMode: string }>('/auth/me/mode', { mode });
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.patch('/auth/me/password', data);
}

export async function deleteAccount(confirmation: string): Promise<void> {
  await apiClient.delete('/auth/me', { confirmation });
}

export async function disconnectFromTherapist(): Promise<void> {
  await apiClient.delete('/therapist/my-therapist');
}

// Chat API

export async function createSession(): Promise<SessionWithMessagesDto> {
  return apiClient.post<SessionWithMessagesDto>('/chat/sessions');
}

export async function getSessions(
  page = 1,
  limit = 20,
  status?: string,
  category?: string,
): Promise<PaginatedSessionsDto> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  if (category) params.set('category', category);
  return apiClient.get<PaginatedSessionsDto>(`/chat/sessions?${params}`);
}

export async function getSession(sessionId: string): Promise<SessionWithMessagesDto> {
  return apiClient.get<SessionWithMessagesDto>(`/chat/sessions/${sessionId}`);
}

export async function sendMessage(
  sessionId: string,
  content: string,
): Promise<{ id: string; content: string }> {
  return apiClient.post(`/chat/sessions/${sessionId}/messages`, { content });
}

export async function endSession(sessionId: string): Promise<void> {
  await apiClient.post(`/chat/sessions/${sessionId}/end`);
}

export async function getAnalysis(sessionId: string): Promise<SessionAnalysisDto> {
  return apiClient.get<SessionAnalysisDto>(`/chat/sessions/${sessionId}/analysis`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/chat/sessions/${sessionId}`);
}

export function getAuthToken(): string | undefined {
  return Cookies.get('token');
}

// === MOOD ===

export function createMood(data: {
  value: number;
  emotions?: string[];
  note?: string;
  sessionId?: string;
}): Promise<MoodEntry> {
  return apiClient.post<MoodEntry>('/mood', data);
}

export function getMoods(from?: string, to?: string): Promise<MoodEntry[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiClient.get<MoodEntry[]>(`/mood?${params}`);
}

export function getMoodStats(): Promise<MoodStats> {
  return apiClient.get<MoodStats>('/mood/stats');
}

export function getMoodEmotions(
  from?: string,
  to?: string,
): Promise<Array<{ emotion: string; count: number }>> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiClient.get<Array<{ emotion: string; count: number }>>(`/mood/emotions?${params}`);
}

export function updateMood(
  id: string,
  data: { value?: number; emotions?: string[]; note?: string },
): Promise<MoodEntry> {
  return apiClient.put<MoodEntry>(`/mood/${id}`, data);
}

export function deleteMood(id: string): Promise<void> {
  return apiClient.delete(`/mood/${id}`);
}

// === DASHBOARD ===

export function getMoodMetrics(from?: string, to?: string): Promise<unknown> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiClient.get<unknown>(`/dashboard/mood-metrics?${params}`);
}

// === THERAPIST ===

export function invitePatient(email: string): Promise<{ inviteCode: string }> {
  return apiClient.post<{ inviteCode: string }>('/therapist/invite', { email });
}

export function acceptInvite(inviteCode: string): Promise<void> {
  return apiClient.post('/therapist/accept-invite', { inviteCode });
}

export function getPatients(): Promise<PatientSummary[]> {
  return apiClient.get<PatientSummary[]>('/therapist/patients');
}

export function getPatientProfile(id: string): Promise<PatientProfileData> {
  return apiClient.get<PatientProfileData>(`/therapist/patients/${id}`);
}

export function getPatientDossier(patientId: string): Promise<PatientDossierResponse> {
  return apiClient.get<PatientDossierResponse>(`/therapist/patients/${patientId}/profile`);
}

export function updateTherapistNotes(
  patientId: string,
  notes: string,
): Promise<{ id: string; therapistNotes: string | null; updatedAt: string }> {
  const body: UpdateTherapistNotesRequest = { notes };
  return apiClient.patch(`/therapist/patients/${patientId}/profile/notes`, body);
}

export function getMyProfile(): Promise<MyProfileDto> {
  return apiClient.get<MyProfileDto>('/profile/my');
}

export function getMyContext(): Promise<{ context: PatientContextData | null }> {
  return apiClient.get<{ context: PatientContextData | null }>('/profile/my/context');
}

export function updateMyContext(
  context: PatientContextData,
): Promise<{ context: PatientContextData }> {
  return apiClient.put<{ context: PatientContextData }>('/profile/my/context', { context });
}

export function getMyTherapist(): Promise<unknown> {
  return apiClient.get<unknown>('/therapist/my-therapist');
}

// === REPORTS ===

export function generateReport(data: {
  patientId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<TherapistReport> {
  return apiClient.post<TherapistReport>('/reports/generate', data);
}

export function getReport(id: string): Promise<TherapistReport> {
  return apiClient.get<TherapistReport>(`/reports/${id}`);
}

export function getPatientReports(patientId: string): Promise<TherapistReport[]> {
  return apiClient.get<TherapistReport[]>(`/reports/patient/${patientId}`);
}

// === SUBSCRIPTION ===

export function getUsageStatus(sessionId?: string, planType?: 'patient' | 'therapist'): Promise<unknown> {
  const params = new URLSearchParams();
  if (sessionId) params.set('sessionId', sessionId);
  if (planType) params.set('planType', planType);
  const qs = params.toString();
  return apiClient.get<unknown>(`/subscription/usage${qs ? `?${qs}` : ''}`);
}

export function getPlans(): Promise<unknown> {
  return apiClient.get<unknown>('/subscription/plans');
}

export interface TherapistFeatures {
  plan: string;
  isTrial: boolean;
  trialEndsAt: string | null;
  patientLimit: number;
  reportLimit: number;
  activePatientCount: number;
  reportsThisMonth: number;
  canWriteMiraInstructions: boolean;
  canViewMoodAnalytics: boolean;
  canViewFullAnalysis: boolean;
}

export function getTherapistFeatures(): Promise<TherapistFeatures> {
  return apiClient.get<TherapistFeatures>('/subscription/therapist-features');
}

export function createCheckout(
  planId: string,
  billing: 'monthly' | 'yearly' = 'monthly',
): Promise<{ url: string | null }> {
  return apiClient.post<{ url: string | null }>('/subscription/checkout', { planId, billing });
}

export function createPackCheckout(packId: string): Promise<{ url: string | null }> {
  return apiClient.post<{ url: string | null }>('/subscription/checkout/pack', { packId });
}

export function completeCheckout(sessionId: string): Promise<{ ok: boolean }> {
  return apiClient.post<{ ok: boolean }>('/subscription/checkout/complete', { sessionId });
}

export function createPortal(): Promise<{ url: string | null }> {
  return apiClient.post<{ url: string | null }>('/subscription/portal', {});
}

// === AUTH ===

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/forgot-password', { email });
}

export function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
}

export function resendVerification(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/resend-verification');
}

export function verifyEmailToken(token: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/verify-email', { token });
}
