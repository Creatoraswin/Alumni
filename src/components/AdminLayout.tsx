"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/useAuth";
import { UserRole } from "@/contexts/auth-context";
import UniversalNav from "@/components/UniversalNav";
import { Student } from "@/services/apiService";

import CenturionLoader from "@/components/CenturionLoader";

interface AdminDataContextType {
  students: Student[];
  loading: boolean;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  allStudents: Student[]; // Add this to provide unfiltered access to all students
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const useAdminData = () => {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminLayout");
  return ctx;
};

const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]); // Store all students separately
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout, students: allStudentsFromAuth, loading } = useAuth();
  const router = useRouter();

  // Memoize the filtering logic to prevent unnecessary re-renders
  const filteredStudents = useMemo(() => {
    let filtered = allStudentsFromAuth;
    if (userRole === "department" && currentDepartmentUser && currentDepartmentUser.department) {
      // For department users, filter by department
      filtered = allStudentsFromAuth.filter(student => 
        student.department &&
        student.department.toLowerCase() === currentDepartmentUser.department.toLowerCase()
      );
    } else if (userRole === "school") {
      // For school users, show only students from assigned departments
      const schoolDepartments = {
        'SoET': ['cse', 'ece', 'mechanical'],
        'SoPAHS': ['radiology', 'optometry', 'forensic', 'anesthesia'],
        'SoM': ['bba']
      };
      if (currentDepartmentUser && currentDepartmentUser.department) {
        const schoolKey = currentDepartmentUser.department.trim();
        if (schoolDepartments[schoolKey]) {
          const allowedDepartments = schoolDepartments[schoolKey].map(dep => dep.trim().toLowerCase());
          filtered = allStudentsFromAuth.filter(student => {
            const studentDept = student.department ? student.department.trim().toLowerCase() : "";
            // Allow partial and case-insensitive match
            return allowedDepartments.some(allowed => studentDept.includes(allowed));
          });
        } else {
          // If mapping key not found, show no students
          filtered = [];
        }
      } else {
        // If no department info, show no students
        filtered = [];
      }
    }
    return filtered;
  }, [userRole, currentDepartmentUser, allStudentsFromAuth]);

  // Update state when filtered students change
  useEffect(() => {
    setStudents(filteredStudents);
    setAllStudents(allStudentsFromAuth);
  }, [filteredStudents, allStudentsFromAuth]);

  if (loading) {
    return <CenturionLoader message="Preparing Alumni Portal..." fullscreen />;
  }

  return (
    <AdminDataContext.Provider value={{ students, allStudents, loading, setStudents }}>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
        <UniversalNav
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          currentStudent={currentStudent}
          currentDepartmentUser={currentDepartmentUser}
          onLoginClick={() => {}}
          onLogout={logout}
        />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </div>
    </AdminDataContext.Provider>
  );
};

export default AdminLayout;