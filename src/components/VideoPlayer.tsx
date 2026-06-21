"use client";

import { useState } from "react";

export default function VideoPlayer() {
  const [play, setPlay] = useState(false);

  return (
    <div className="relative w-full pb-[56.25%] h-0 rounded-xl overflow-hidden bg-gray-900 shadow-xl">
      {!play ? (
        <div
          className="cursor-pointer absolute inset-0 w-full h-full"
          onClick={() => setPlay(true)}
        >
          <img
            src="https://img.youtube.com/vi/B4vNV49aJL4/maxresdefault.jpg"
            alt="Video Thumbnail"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src="https://www.youtube.com/embed/B4vNV49aJL4?si=uImwSdq5KKF2T1r0&autoplay=1"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
    </div>
  );
}
