"use client";

import { createContext } from 'react';
import { Student } from '@/services/apiService';

export type UserRole = "student" | "admin" | "department" | "school" | "alumni-manager" | "cadmin";

export interface DepartmentUser {
  username: string;
  role: Exclude<UserRole, 'student'>; // All roles except 'student'
  department: string;
  name: string;
  email: string;
  departments?: string[]; // For school users to list their departments
}

export interface AuthContextType {
  isLoggedIn: boolean;
  userRole: UserRole | null;
  currentStudent: Student | null;
  currentDepartmentUser: DepartmentUser | null;
  setCurrentStudent: (student: Student | null) => void;
  setCurrentDepartmentUser: (user: DepartmentUser | null) => void;
  students: Student[];
  setStudents: (students: Student[]) => void;
  loading: boolean;
  dataLoaded: boolean;
  refreshData: (forceRefresh?: boolean) => Promise<Student[]>;
  login: (role: UserRole, student?: Student, departmentUser?: DepartmentUser) => void;
  logout: () => void;
  onLoginClick: (role: UserRole, student?: Student, departmentUser?: DepartmentUser) => void;
  onLogout: () => void;
  isAuthReady: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userRole: null,
  currentStudent: null,
  currentDepartmentUser: null,
  setCurrentStudent: () => {},
  setCurrentDepartmentUser: () => {},
  students: [],
  setStudents: () => {},
  loading: false,
  dataLoaded: false,
  refreshData: async () => [],
  login: () => {},
  logout: () => {},
  onLoginClick: () => {},
  onLogout: () => {},
  isAuthReady: false,
});
