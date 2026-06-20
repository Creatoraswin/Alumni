import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Alumni Meets | CUTMAP",
  description: "Join upcoming alumni meets and connect with fellow graduates.",
};


import AlumniMeets from "@/components/pages/AlumniMeets";

export default function AlumniMeetsPage() {
  return <AlumniMeets />;
}
