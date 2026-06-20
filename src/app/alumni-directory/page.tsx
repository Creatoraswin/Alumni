import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Alumni Directory | CUTMAP",
  description: "Browse the comprehensive directory of CUTMAP alumni, connect with professionals, and build your network.",
};


import Index from "@/components/pages/Index";

export default function AlumniDirectoryPage() {
  return <Index />;
}
