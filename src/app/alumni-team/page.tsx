import { Metadata } from 'next';
import AlumniTeamPage from '@/components/pages/AlumniTeam';

export const metadata: Metadata = {
  title: 'Alumni Team | CUTMAP',
  description: 'Meet the dedicated Alumni Team and Student Coordinators of the CUTMAP Alumni Association.',
};

export default function AlumniTeamRoute() {
  return <AlumniTeamPage />;
}
