"use client";

import React, { Suspense } from 'react';
import AlumniMeetDetail from "@/components/pages/AlumniMeetDetail";

export default function AlumniMeetDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AlumniMeetDetail />
    </Suspense>
  );
}
