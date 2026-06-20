import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "CUTMAP Alumni Network",
  description: "Stay connected with your batchmates, explore opportunities, and build your network at the CUTMAP Alumni portal.",
};


import Home from "@/components/pages/Home";

export default function HomePage() {
  return <Home />;
}
