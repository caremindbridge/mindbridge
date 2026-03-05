'use client';

import type { PatientContextData } from '@mindbridge/types/src/profile';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getMyContext,
  getMyProfile,
  getPatientDossier,
  updateMyContext,
  updateTherapistNotes,
} from '@/shared/api/client';

export function usePatientDossier(patientId: string) {
  return useQuery({
    queryKey: ['patient-dossier', patientId],
    queryFn: () => getPatientDossier(patientId),
    enabled: !!patientId,
  });
}

export function useUpdateTherapistNotes(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes: string) => updateTherapistNotes(patientId, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patient-dossier', patientId] }),
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });
}

export function useMyContext() {
  return useQuery({
    queryKey: ['my-context'],
    queryFn: getMyContext,
  });
}

export function useUpdateMyContext() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (context: PatientContextData) => updateMyContext(context),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-context'] }),
  });
}
