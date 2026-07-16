import { Metadata } from 'next';
import StudentAmbassadorPage from '@/components/pages/StudentAmbassador';

export const metadata: Metadata = {
  title: 'Student Ambassadors | CUTMAP',
  description: 'Meet the CUTMAP Student Ambassadors — connect, get guidance, and stay inspired.',
};

export default function StudentAmbassadorRoute() {
  return <StudentAmbassadorPage />;
}
