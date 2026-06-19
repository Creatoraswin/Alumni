"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from "../contexts/useAuth";

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { isLoggedIn, userRole, isAuthReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until auth state has been loaded from localStorage
    if (!isAuthReady) return;

    // Check if user is logged in
    if (!isLoggedIn) {
      router.replace("/");
      return;
    }

    // If a specific role is required, check if user has that role
    if (requiredRole && userRole !== requiredRole) {
      // Redirect to appropriate page based on user's actual role
      if (userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") {
        router.replace(userRole === "admin" ? "/admin" : userRole === "cadmin" ? "/cadmin" : "/alumni-manager");
      } else if (userRole === "department") {
        router.replace("/department");
      } else if (userRole === "school") {
        router.replace("/school");
      } else {
        router.replace("/");
      }
    }
  }, [isAuthReady, isLoggedIn, userRole, requiredRole, router]);

  // Don't render children if auth state is not ready yet
  if (!isAuthReady) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  }

  // Once auth is ready, double check authorization rules
  if (!isLoggedIn) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  }

  return children;
};

export default ProtectedRoute;
