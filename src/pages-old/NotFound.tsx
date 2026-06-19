"use client";

import { usePathname } from 'next/navigation';

const NotFound = () => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
        <a href="/" className="text-primary hover:opacity-90 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
