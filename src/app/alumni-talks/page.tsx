import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Alumni Talks | CUTMAP",
  description: "Watch and learn from insightful talks and presentations given by CUTMAP alumni.",
};


import AlumniTalks from "@/components/pages/AlumniTalks";

export default function AlumniTalksPage() {
  return <AlumniTalks />;
}
