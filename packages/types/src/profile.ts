export interface PatientProfileDto {
  id: string;
  userId: string;
  content: string;
  therapistNotes: string | null;
  sessionsIncorporated: number;
  updatedAt: string;
  createdAt: string;
}
