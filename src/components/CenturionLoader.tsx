"use client";

import React from "react";

interface CenturionLoaderProps {
  message?: string;
  fullscreen?: boolean;
}

export default function CenturionLoader({ 
  message = "Loading alumni data...", 
  fullscreen = false 
}: CenturionLoaderProps) {
  const containerClasses = fullscreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 backdrop-blur-md"
    : "flex flex-col items-center justify-center min-h-[350px] w-full p-8";

  return (
    <div className={containerClasses}>
      <div className="relative flex flex-col items-center">
        {/* Glowing backdrop circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse" />
        
        {/* Centered Logo with hover scale and pulsing */}
        <div className="relative z-10 bg-white p-5 rounded-3xl shadow-glow border border-primary/10 animate-bounce duration-1000">
          <img 
            src="/Centurion-University-AP-logo.webp" 
            alt="Centurion University AP" 
            className="h-20 w-16 object-contain"
          />
        </div>

        {/* Ring Spinner around the logo */}
        <div className="absolute -top-3 w-38 h-38 rounded-full border-4 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '1.5s' }} />
        
        {/* Elegant loading text below */}
        <div className="mt-8 text-center">
          <h3 className="text-xl font-bold text-gradient-primary tracking-wide">
            {message}
          </h3>
          <p className="text-xs text-muted-foreground mt-2 animate-pulse font-medium uppercase tracking-widest">
            Centurion University AP
          </p>
        </div>
      </div>
    </div>
  );
}
