"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from "@/contexts/useAuth";
import UniversalNav from "@/components/UniversalNav";
import AdminPanel from "@/components/AdminPanel";
import AlumniManagementTab from "@/components/AlumniManagementTab";
import AnalyticsTab from "@/components/AnalyticsTab";
import FilterSection from "@/components/FilterSection";
import { Student } from "@/services/apiService";

const AlumniManagement = () => {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, userRole, currentStudent, logout, students, loading } = useAuth();

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSchool("all");
    setSelectedYear("all");
    setSelectedProgramme("all");
    setSelectedDepartment("all");
  };

  const filteredStudents = students.filter(student => {
    const matchesYear = selectedYear === "all" || student.graduationYear === selectedYear;
    const matchesSchool = selectedSchool === "all" || student.school === selectedSchool;
    const matchesProgramme = selectedProgramme === "all" || student.programme === selectedProgramme;
    const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment;
    const matchesSearch = searchTerm === "" ||
      (typeof student.registrationNo === 'string' && student.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof student.name === 'string' && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof student.programme === 'string' && student.programme.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof student.currentPosition === 'string' && student.currentPosition.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof student.organisation === 'string' && student.organisation.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesYear && matchesSchool && matchesProgramme && matchesDepartment && matchesSearch;
  });

  if (loading) {
    return <div className="p-8 text-center">Loading alumni data...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        currentStudent={currentStudent}
        onLoginClick={() => {}}
        onLogout={logout}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {pathname === "/admin" && (
          <AdminPanel students={students} />
        )}
        {pathname === "/admin/alumni-management" && (
          <>
            <div className="sticky top-20 z-30 bg-white bg-opacity-95 border-b border-gray-200 shadow-sm">
              <FilterSection
                students={students}
                filteredStudents={filteredStudents}
                selectedYear={selectedYear}
                selectedSchool={selectedSchool}
                selectedProgramme={selectedProgramme}
                selectedDepartment={selectedDepartment}
                searchTerm={searchTerm}
                onYearChange={setSelectedYear}
                onSchoolChange={setSelectedSchool}
                onProgrammeChange={setSelectedProgramme}
                onDepartmentChange={setSelectedDepartment}
                onSearchChange={setSearchTerm}
                onClearFilters={handleClearFilters}
              />
            </div>
            <AlumniManagementTab students={filteredStudents} onStudentUpdate={() => {}} userRole="admin" />
          </>
        )}
        {pathname === "/admin/analytics" && (
          <>
            <div className="sticky top-20 z-30 bg-white bg-opacity-95 border-b border-gray-200 shadow-sm">
              <FilterSection
                students={students}
                filteredStudents={filteredStudents}
                selectedYear={selectedYear}
                selectedSchool={selectedSchool}
                selectedProgramme={selectedProgramme}
                selectedDepartment={selectedDepartment}
                searchTerm={searchTerm}
                onYearChange={setSelectedYear}
                onSchoolChange={setSelectedSchool}
                onProgrammeChange={setSelectedProgramme}
                onDepartmentChange={setSelectedDepartment}
                onSearchChange={setSearchTerm}
                onClearFilters={handleClearFilters}
              />
            </div>
            <AnalyticsTab students={filteredStudents} />
          </>
        )}
        {!["/admin", "/admin/alumni-management", "/admin/analytics"].includes(pathname) && (
          <div className="p-8 text-center">Not found</div>
        )}
      </div>
    </div>
  );
};
export default AlumniManagement;