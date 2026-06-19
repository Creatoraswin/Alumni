"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Student, fetchStudentsData } from '@/services/apiService';
import { analyticsDataCache } from '@/services/analyticsDataCache';

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: 'student' | 'admin' | null;
  currentStudent: Student | null;
  setCurrentStudent: React.Dispatch<React.SetStateAction<Student | null>>;
  login: (role: 'student' | 'admin', student?: Student) => void;
  logout: () => void;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'admin' | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      // Fetch all students including unapproved ones since this is used in admin views
      const studentsData = await fetchStudentsData(true);
      setStudents(studentsData);
      setLoading(false);
    };
    loadStudents();
  }, []);

  // Preload analytics data to improve performance of Detailed Analytics page
  useEffect(() => {
    analyticsDataCache.refreshCache();
  }, []);

  const login = (role: 'student' | 'admin', student?: Student) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentStudent(student || null);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentStudent(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, currentStudent, setCurrentStudent, login, logout, students, setStudents, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 