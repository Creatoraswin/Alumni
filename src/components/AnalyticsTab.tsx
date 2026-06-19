"use client";

import { useAdminData } from "@/components/AdminLayout";
import EmploymentStatusOverview from "./EmploymentStatusOverview";
import JobRolesDistribution from "./JobRolesDistribution";
import CompanyWiseDistribution from "./CompanyWiseDistribution";
import FilterSection from "./FilterSection";
import { Student } from "@/services/apiService";
import { useState } from "react";

interface AnalyticsTabProps {
  students?: Student[];
}

const AnalyticsTab = (props: AnalyticsTabProps) => {
  const adminData = useAdminData();
  const students = props.students ?? adminData.students;
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  if (!students) return null;
  // Filter students - only show approved students by default
  const filteredStudents = students.filter(student => {
    // First check approval status
    const isApproved = student.Status === 'Approved';
    if (!isApproved) return false;
    
    // Then apply other filters
    const search = searchTerm.toLowerCase();
    const matchesYear = selectedYear === "all" || student.graduationYear === selectedYear;
    const matchesSchool = selectedSchool === "all" || student.school === selectedSchool;
    const matchesProgramme = selectedProgramme === "all" || student.programme === selectedProgramme;
    const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment;
    const matchesSearch = search === "" ||
      (typeof student.registrationNo === 'string' && student.registrationNo.toLowerCase().includes(search)) ||
      (typeof student.name === 'string' && student.name.toLowerCase().includes(search)) ||
      (typeof student.email === 'string' && student.email.toLowerCase().includes(search)) ||
      (typeof student.school === 'string' && student.school.toLowerCase().includes(search)) ||
      (typeof student.department === 'string' && student.department.toLowerCase().includes(search)) ||
      (typeof student.programme === 'string' && student.programme.toLowerCase().includes(search)) ||
      (typeof student.currentPosition === 'string' && student.currentPosition.toLowerCase().includes(search)) ||
      (typeof student.organisation === 'string' && student.organisation.toLowerCase().includes(search));
    return matchesYear && matchesSchool && matchesProgramme && matchesDepartment && matchesSearch;
  });
  return (
    <div className="px-2 md:px-0">
      {/* Sticky FilterSection Bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur shadow rounded-b-none rounded-t-lg px-0 py-0 mb-4">
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
          onClearFilters={() => {
            setSearchTerm("");
            setSelectedSchool("all");
            setSelectedYear("all");
            setSelectedProgramme("all");
            setSelectedDepartment("all");
          }}
        />
      </div>
      {/* Section Title */}
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
        Alumni Analytics Overview
      </h2>
      {/* Employment Status Overview in its own row */}
      <div className="w-full mb-10">
        <EmploymentStatusOverview students={filteredStudents} />
      </div>
      {/* Job Roles & Designations in a separate row with two columns */}
      <div className="w-full mb-10">
        <JobRolesDistribution students={filteredStudents} />
      </div>
      {/* Company-wise Alumni Distribution below, visually separated */}
      <div className="w-full mt-10">
        <CompanyWiseDistribution students={filteredStudents} />
      </div>
    </div>
  );
};

export default AnalyticsTab;