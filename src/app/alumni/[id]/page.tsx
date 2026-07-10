import { Metadata, ResolvingMetadata } from 'next';
import AlumniProfileClient from './AlumniProfileClient';

type Props = {
  params: Promise<{ id: string }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://alumni.sparvixainnovations.com/backend/api";

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const res = await fetch(`${API_URL}/students/get_single.php?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const responseData = await res.json();
    
    if (responseData.success && responseData.data) {
      const student = responseData.data;
      const title = `${student.name} - ${student.programme} | CUTMAP Alumni`;
      const description = `Profile of ${student.name}, currently ${student.current_position || 'a professional'} at ${student.organisation || 'an organization'}. Graduated in ${student.year_of_graduation || 'recent years'} from ${student.department || 'CUTMAP'}.`;
      
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          images: student.photo_url ? [student.photo_url] : [],
        },
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: `Alumni Profile | CUTMAP`,
    description: `View CUTMAP alumni profile.`,
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/students/index.php?showAll=true`, { cache: 'no-store' });
    if (res.ok) {
      const responseData = await res.json();
      if (responseData.success && Array.isArray(responseData.data)) {
        return responseData.data
          .filter((s: any) => s.status === 'Approved')
          .map((student: any) => ({
            id: student.registration_no,
          }));
      }
    }
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
  }
  return []; // Fallback empty array
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  return <AlumniProfileClient registrationNo={resolvedParams.id} />
}
