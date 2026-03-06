export enum UserRole {
  PATIENT = 'patient',
  THERAPIST = 'therapist',
}

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: UserRole;
  activeMode: 'therapist' | 'patient';
  provider: string | null;
  emailVerified: boolean;
  createdAt: string;
}
