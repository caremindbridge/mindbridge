export interface PatientContextData {
  name?: string;
  age?: number;
  pronouns?: string;
  medications?: string;
  diagnoses?: string;
  previousTherapy?: string;
  occupation?: string;
  relationships?: string;
  livingSituation?: string;
  goals?: string;
  additionalNotes?: string;
  updatedAt?: string;
}

export interface PatientProfileDto {
  id: string;
  userId: string;
  content: string;
  therapistNotes: string | null;
  sessionsIncorporated: number;
  updatedAt: string;
  createdAt: string;
}

export interface PatientDossierResponse {
  patientId?: string;
  hasDossier: boolean;
  updatedAt?: string;
  intake?: PatientContextData | null;
  clinicalProfile?: { content: string; sessionsIncorporated: number } | null;
  therapistNotes?: string | null;
  message?: string;
}

export interface UpdateTherapistNotesRequest {
  notes: string;
}

export interface MyProfileDto {
  content: string | null;
  sessionsIncorporated: number;
  updatedAt?: string;
}
