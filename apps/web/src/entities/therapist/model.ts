'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PatientProfileData, PatientSummary } from '@mindbridge/types/src/therapist';

import {
  ApiError,
  acceptInvite,
  disconnectFromTherapist,
  getMyTherapist,
  getPatientProfile,
  getPatients,
  invitePatient,
} from '@/shared/api/client';

export function usePatients() {
  return useQuery<PatientSummary[]>({
    queryKey: ['patients'],
    queryFn: getPatients,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePatientProfile(id: string) {
  return useQuery<PatientProfileData>({
    queryKey: ['patient-profile', id],
    queryFn: () => getPatientProfile(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-therapist'] }),
  });
}

export function useMyTherapist() {
  return useQuery({
    queryKey: ['my-therapist'],
    queryFn: async () => {
      try {
        return await getMyTherapist();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });
}

export function useDisconnectFromTherapist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectFromTherapist,
    onSuccess: () => qc.setQueryData(['my-therapist'], null),
  });
}
