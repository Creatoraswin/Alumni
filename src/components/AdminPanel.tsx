"use client";

import { useAdminData } from "@/components/AdminLayout";
import { useAuth } from "@/contexts/useAuth";
import DashboardStats from "./DashboardStats";
import AlumniManagementTab from "./AlumniManagementTab";
import AnalyticsTab from "./AnalyticsTab";
import FilterSection from "./FilterSection";
import { Student } from "@/services/apiService";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, Settings } from "lucide-react";

interface AdminPanelProps {
  students?: Student[];
}

const AdminPanel = (props: AdminPanelProps) => {
  const adminData = useAdminData();
  const { userRole, currentDepartmentUser } = useAuth();
  const students = props.students ?? adminData.students;
  
  // Shared filter state
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const handleClearFilters = () => {
    setSelectedYear("all");
    setSelectedSchool("all");
    setSelectedProgramme("all");
    setSelectedDepartment("all");
    setSearchTerm("");
  };

  // Filtering logic - Only show approved students by default
  const filteredStudents = students.filter(student => {
    // First filter by approval status
    const isApproved = student.Status === 'Approved';
    if (!isApproved) return false;
    
    // Then apply other filters
    const matchesYear = selectedYear === "all" || student.graduationYear === selectedYear;
    const matchesSchool = selectedSchool === "all" || student.school === selectedSchool;
    const matchesProgramme = selectedProgramme === "all" || student.programme === selectedProgramme;
    const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment;
    const search = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || (
      (typeof student.registrationNo === 'string' && student.registrationNo.toLowerCase().includes(search)) ||
      (typeof student.name === 'string' && student.name.toLowerCase().includes(search)) ||
      (typeof student.email === 'string' && student.email.toLowerCase().includes(search)) ||
      (typeof student.school === 'string' && student.school.toLowerCase().includes(search)) ||
      (typeof student.department === 'string' && student.department.toLowerCase().includes(search)) ||
      (typeof student.programme === 'string' && student.programme.toLowerCase().includes(search)) ||
      (typeof student.currentPosition === 'string' && student.currentPosition.toLowerCase().includes(search)) ||
      (typeof student.organisation === 'string' && student.organisation.toLowerCase().includes(search))
    );
    return matchesYear && matchesSchool && matchesProgramme && matchesDepartment && matchesSearch;
  });

  const handleStudentUpdate = (updatedStudent: Student) => {
    adminData.setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  // Get role-specific title
  const getRoleTitle = () => {
    if (userRole === "admin") return "Admin Dashboard";
    if (userRole === "cadmin") return "Higher Management Dashboard";
    if (userRole === "department" && currentDepartmentUser) {
      return `${currentDepartmentUser.department.toUpperCase()} Department Dashboard`;
    }
    if (userRole === "school" && currentDepartmentUser) {
      return `${currentDepartmentUser.department} School Dashboard`;
    }
    if (userRole === "alumni-manager") return "Alumni Manager Dashboard";
    return "Dashboard";
  };

  return (
    <div className="space-y-6">
      {(userRole === "department" || userRole === "school") && (
        <div className="card-enhanced p-8 animate-fade-in-up">
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-gradient-primary mb-3">{getRoleTitle()}</h3>
            <p className="text-muted-foreground text-lg">
              {/* {(userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") && "Manage all alumni data and system settings"} */}
              {userRole === "department" && currentDepartmentUser && `Manage alumni from ${currentDepartmentUser.department.toUpperCase()} department`}
              {userRole === "school" && currentDepartmentUser && `Manage alumni from ${currentDepartmentUser.department} school`}
            </p>
          </div>
        </div>
      )}

      <DashboardStats students={students} />
    </div>
  );
};

export default AdminPanel;