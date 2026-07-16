"use client";

import React, { Suspense, useMemo } from 'react';
import StudentProfileView from '@/components/pages/StudentProfileView';
import UniversalNav from '@/components/UniversalNav';
import { useAuth } from '@/contexts/useAuth';

import { Student } from '@/services/apiService';

interface AlumniProfileClientProps {
  registrationNo: string;
  initialStudent?: Student | null;
}

function StudentProfileWrapper({ registrationNo, initialStudent }: AlumniProfileClientProps) {
  const { students, isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout } = useAuth();

  const student = useMemo(() => {
    if (initialStudent) return initialStudent;
    if (!registrationNo) return null;
    return students.find(s => s.registrationNo === registrationNo);
  }, [registrationNo, students, initialStudent]);

  if (!registrationNo || (!student && students.length > 0)) {
    return (
      <div className="min-h-screen bg-background">
        <UniversalNav
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          currentStudent={currentStudent}
          currentDepartmentUser={currentDepartmentUser}
          onLoginClick={() => {}}
          onLogout={logout}
        />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <h2 className="text-2xl font-bold mb-4">Student Not Found</h2>
          <p className="text-muted-foreground">The requested alumni profile could not be found.</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <StudentProfileView student={student} />;
}

export default function AlumniProfileClient({ registrationNo, initialStudent }: AlumniProfileClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <StudentProfileWrapper registrationNo={registrationNo} initialStudent={initialStudent} />
    </Suspense>
  );
}
