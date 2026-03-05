'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { generateReport, getPatientReports, getReport } from '@/shared/api/client';

export function useReport(id: string | null) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => getReport(id!),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.status === 'generating' ? 3000 : false),
  });
}

export function usePatientReports(patientId: string) {
  return useQuery({
    queryKey: ['patient-reports', patientId],
    queryFn: () => getPatientReports(patientId),
    enabled: !!patientId,
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateReport,
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['patient-reports', vars.patientId] }),
  });
}
