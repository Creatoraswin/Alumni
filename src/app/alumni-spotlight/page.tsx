import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Alumni Spotlight | CUTMAP",
  description: "Discover inspiring success stories and achievements of our notable CUTMAP alumni.",
};


import AlumniSpotlight from "@/components/pages/AlumniSpotlight";

export default function AlumniSpotlightPage() {
  return <AlumniSpotlight />;
}
