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

import { Student } from '@/services/apiService';

const deriveDepartment = (programme: string): string => {
  if (!programme) return "NA";
  const p = programme.toLowerCase();
  if (p.includes("cse")) return "cse";
  if (p.includes("ece")) return "ece";
  if (p.includes("mechanical") || p.includes("mech")) return "mechanical";
  if (p.includes("radiology")) return "radiology";
  if (p.includes("optometry")) return "optometry";
  if (p.includes("anaesthesia") || p.includes("anesthesia")) return "anesthesia";
  if (p.includes("forensic")) return "forensic";
  if (p.includes("bba")) return "bba";
  return "NA";
};

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  let student: Student | null = null;

  try {
    const res = await fetch(`${API_URL}/students/get_single.php?id=${id}`);
    if (res.ok) {
      const responseData = await res.json();
      if (responseData.success && responseData.data) {
        const dbStudent = responseData.data;
        student = {
          id: String(dbStudent.registration_no || ''),
          name: dbStudent.name || "NA",
          email: dbStudent.email || "NA",
          personalEmail: dbStudent.personal_email || "",
          phone: dbStudent.mobile_no || "NA",
          department: dbStudent.department || deriveDepartment(dbStudent.programme),
          graduationYear: String(dbStudent.year_of_graduation || "NA"),
          currentPosition: dbStudent.current_position || "NA",
          currentJob: dbStudent.present_occupation || "NA",
          currentCompany: dbStudent.organisation || "NA",
          currentLocation: dbStudent.location || "NA",
          currentDesignation: dbStudent.designation || "NA",
          universityName: dbStudent.university_name || "NA",
          areaOfStudy: dbStudent.area_of_study || "NA",
          location: dbStudent.location || "NA",
          areaOfInterest: dbStudent.area_of_interest || "NA",
          photoUrl: (dbStudent.photo_url || "").replace(/\.(jpg|jpeg|png)$/i, '.webp'),
          registrationNo: String(dbStudent.registration_no || "NA"),
          school: dbStudent.school || "NA",
          programme: dbStudent.programme || "NA",
          designation: dbStudent.designation || "NA",
          organisation: dbStudent.organisation || "NA",
          placeOfWork: dbStudent.place_of_work || "NA",
          linkedinId: dbStudent.linkedin_id || "NA",
          dob: dbStudent.dob || "NA",
          address: dbStudent.address || "NA",
          feedback: dbStudent.feedback || "NA",
          Status: dbStudent.status || "Pending",
          status: dbStudent.status || "Pending",
          skills: [],
          Timestamp: dbStudent.timestamp || "NA",
          currentjob: dbStudent.present_occupation || "NA"
        };
      }
    }
  } catch (error) {
    console.error('Error fetching student details on server:', error);
  }

  return <AlumniProfileClient registrationNo={id} initialStudent={student} />
}
