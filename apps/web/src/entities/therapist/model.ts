'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PatientProfileData, PatientSummary } from '@mindbridge/types/src/therapist';

import {
  acceptInvite,
  disconnectFromTherapist,
  getMyTherapist,
  getPatientProfile,
  getPatients,
  invitePatient,
} from '@/shared/api/client';

export function usePatients() {
  return useQuery<PatientSummary[]>({ queryKey: ['patients'], queryFn: getPatients });
}

export function usePatientProfile(id: string) {
  return useQuery<PatientProfileData>({
    queryKey: ['patient-profile', id],
    queryFn: () => getPatientProfile(id),
    enabled: !!id,
  });
}

export function useInvitePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invitePatient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useAcceptInvite() {
  return useMutation({ mutationFn: acceptInvite });
}

export function useMyTherapist() {
  return useQuery({ queryKey: ['my-therapist'], queryFn: getMyTherapist });
}

export function useDisconnectFromTherapist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectFromTherapist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-therapist'] }),
  });
}
