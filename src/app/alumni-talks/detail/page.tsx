"use client";

import React, { Suspense } from 'react';
import AlumniTalkDetail from "@/components/pages/AlumniTalkDetail";

export default function AlumniTalkDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AlumniTalkDetail />
    </Suspense>
  );
}
