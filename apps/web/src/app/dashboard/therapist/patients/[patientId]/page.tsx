import { PatientProfilePage } from '@/views/patient-profile';

interface Props {
  params: { patientId: string };
}

export default function PatientProfileRoute({ params }: Props) {
  return <PatientProfilePage patientId={params.patientId} />;
}
