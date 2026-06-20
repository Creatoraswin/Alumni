"use client";

import { useState, useEffect, ReactNode } from 'react';
import { Student, fetchStudentsData } from '@/services/apiService';
import { dataCache } from '@/services/dataCache';
import { AuthContext, DepartmentUser, type AuthContextType } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export { type AuthContextType, type DepartmentUser } from './auth-context';

// Helper hook to get cache statistics for debugging
export const useCacheStats = () => {
  return dataCache.getCacheStats();
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Initialize state to safe default values to match Server-Side Rendering
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "admin" | "department" | "school" | "alumni-manager" | "cadmin" | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentDepartmentUser, setCurrentDepartmentUser] = useState<DepartmentUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load auth state from localStorage on client side after mounting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(storedLoggedIn);
      
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'student' || storedRole === 'admin' || storedRole === 'department' || storedRole === 'school' || storedRole === 'alumni-manager' || storedRole === 'cadmin') {
        setUserRole(storedRole);
      }
      
      const storedStudent = localStorage.getItem('currentStudent');
      if (storedStudent) {
        try {
          setCurrentStudent(JSON.parse(storedStudent));
        } catch (e) {
          console.error("Error parsing stored student data:", e);
        }
      }
      
      const storedDepartmentUser = localStorage.getItem('currentDepartmentUser');
      if (storedDepartmentUser) {
        try {
          setCurrentDepartmentUser(JSON.parse(storedDepartmentUser));
        } catch (e) {
          console.error("Error parsing stored department user data:", e);
        }
      }
      
      setIsAuthReady(true);
    }
  }, []);

  // Fetch student data on client side after mounting
  useEffect(() => {
    const loadStudents = async () => {
      try {
        let studentsData: Student[] = [];

        // If we already have cached data, use it
        if (dataCache.hasValidCache()) {
          studentsData = dataCache.getCachedData()!;
          setStudents(studentsData);
          setDataLoaded(true);
        } else {
          setLoading(true);
          // Use cache service to get data
          // For the main student list, we want all students including unapproved ones
          // The individual components will filter as needed
          studentsData = await dataCache.getData(() => fetchStudentsData(true)); // Pass true to get all students
          setStudents(studentsData);
          setDataLoaded(true);
        }

        // Update current student if it exists, using whichever data we got (cached or fresh)
        const storedStudentStr = localStorage.getItem('currentStudent');
        if (storedStudentStr && studentsData.length > 0) {
          try {
            const storedStudent = JSON.parse(storedStudentStr);
            const regNo = storedStudent.registrationNo || storedStudent.registration_no;
            if (storedStudent && regNo) {
              const freshStudent = studentsData.find(s => s.registrationNo === regNo);
              if (freshStudent) {
                setCurrentStudent(freshStudent);
                localStorage.setItem('currentStudent', JSON.stringify(freshStudent));
              }
            }
          } catch (e) {
            console.error("Error updating current student from fresh data:", e);
          }
        }
      } catch (error) {
        // Keep any existing cached data in case of error
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const login = (role: "student" | "admin" | "department" | "school" | "alumni-manager" | "cadmin", student?: Student, departmentUser?: DepartmentUser) => {
    // Default to student role if not specified
    if (!role) {
      role = "student";
    }
    
    // Store login info in localStorage for persistence
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
    
    setIsLoggedIn(true);
    setUserRole(role);
    
    if (role === "student" && student) {
      setCurrentStudent(student);
      setCurrentDepartmentUser(null);
      localStorage.setItem('currentStudent', JSON.stringify(student));
      localStorage.removeItem('currentDepartmentUser');
    } else if (role === "admin" || role === "cadmin") {
      setCurrentStudent(null);
      setCurrentDepartmentUser(null);
      localStorage.removeItem('currentStudent');
      localStorage.removeItem('currentDepartmentUser');
    } else if ((role === "department" || role === "school" || role === "alumni-manager") && departmentUser) {
      setCurrentStudent(null);
      setCurrentDepartmentUser(departmentUser);
      localStorage.removeItem('currentStudent');
      localStorage.setItem('currentDepartmentUser', JSON.stringify(departmentUser));
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentStudent');
    localStorage.removeItem('currentDepartmentUser');
    
    // Update state
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentStudent(null);
    setCurrentDepartmentUser(null);
  };

  // Implementation of the AuthContextType interface functions
  const handleLogin = (role: "student" | "admin" | "department" | "school" | "alumni-manager" | "cadmin", student?: Student, departmentUser?: DepartmentUser) => {
    login(role, student, departmentUser);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userRole,
        currentStudent,
        currentDepartmentUser,
        setCurrentStudent,
        setCurrentDepartmentUser,
        students,
        setStudents: (newStudents: Student[]) => {
          setStudents(newStudents);
          // Update cache when students data changes
          dataCache.cacheData(newStudents);
        },
        loading,
        dataLoaded,
        refreshData: async (forceRefresh = false) => {
          try {
            setLoading(true);
            const data = await dataCache.getData(() => fetchStudentsData(true), forceRefresh); // Pass true to get all students
            setStudents(data);
            setDataLoaded(true);
            return data;
          } finally {
            setLoading(false);
          }
        },
        login,
        logout,
        onLoginClick: handleLogin,
        onLogout: handleLogout,
        isAuthReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};