"use client";

import React, { Suspense } from 'react';
import YouTubePlayer from "@/components/pages/YouTubePlayer";

export default function YouTubePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading YouTube Player...</div>}>
      <YouTubePlayer />
    </Suspense>
  );
}
