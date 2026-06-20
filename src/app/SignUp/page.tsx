import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Alumni Registration | CUTMAP",
  description: "Register to join the CUTMAP Alumni Network.",
};


import SignUp from "@/components/pages/SignUp";

export default function SignUpPage() {
  return <SignUp />;
}
