import { Metadata, ResolvingMetadata } from 'next';
import { fetchStudentsData } from '@/services/apiService';
import StudentProfileView from '@/components/pages/StudentProfileView';
import { notFound } from 'next/navigation';
import UniversalNav from '@/components/UniversalNav'; // Import UniversalNav properly or handle it in client

type Props = {
  params: { registrationNo: string };
};

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { registrationNo } = await params;
  const decodedRegistrationNo = decodeURIComponent(registrationNo);
  const students = await fetchStudentsData(true);
  const student = students.find(s => s.registrationNo === decodedRegistrationNo);

  if (!student) {
    return {
      title: 'Student Not Found',
    };
  }

  const jobInfo = student.currentPosition && student.currentPosition !== "NA" && student.currentPosition !== "Not specified"
    ? student.currentPosition
    : student.designation && student.designation !== "NA" && student.designation !== "Not specified"
    ? student.designation
    : "";
  
  const companyInfo = student.organisation && student.organisation !== "NA" && student.organisation !== "Not specified"
    ? ` at ${student.organisation}`
    : "";

  const title = `${student.name} ${jobInfo ? `| ${jobInfo}${companyInfo}` : ''} | CUTMAP Alumni`;
  const description = `View the alumni profile of ${student.name}, a graduate of ${student.school} (${student.graduationYear}) from CUTMAP.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: student.photoUrl ? [student.photoUrl] : [],
    },
  };
}

export default async function StudentPage({ params }: Props) {
  const { registrationNo } = await params;
  const decodedRegistrationNo = decodeURIComponent(registrationNo);
  const students = await fetchStudentsData(true);
  const student = students.find(s => s.registrationNo === decodedRegistrationNo);

  if (!student) {
    notFound();
  }

  return <StudentProfileView student={student} />;
}
