"use client";

import { usePathname } from 'next/navigation';
import UniversalNav from "./UniversalNav";
import { useAuth } from "@/contexts/useAuth";
import React from "react";

const StudentLayout = ({ children }: { children?: React.ReactNode }) => {
  const { isLoggedIn, userRole, currentStudent, onLogout } = useAuth();
  const pathname = usePathname();

  // Create a wrapper function for onLoginClick since Header expects no parameters
  const handleLoginClick = () => {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        currentStudent={currentStudent}
        onLoginClick={handleLoginClick}
        onLogout={onLogout}
      />
      <div className="flex-1 mt-16">
        {children}
      </div>
    </div>
  );
};

export default StudentLayout;