import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Alumni News | CUTMAP",
  description: "Stay updated with the latest news, events, and announcements from the CUTMAP Alumni network.",
};


import News from "@/components/pages/News";

export default function NewsPage() {
  return <News />;
}
