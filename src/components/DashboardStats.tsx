"use client";


import OverviewCards from "./OverviewCards";
import SchoolDistributionChart from "./SchoolDistributionChart";
import DepartmentChart from "./DepartmentChart";
import GraduationYearChart from "./GraduationYearChart";
import ProgrammeAnalytics from "./ProgrammeAnalytics";
import { Student } from "@/services/apiService";
import { useAuth } from "@/contexts/useAuth";
import DepartmentDistributionChart from "./DepartmentDistributionChart";
import ProgramDistributionChart from "./ProgramDistributionChart";

interface DashboardStatsProps {
  students: Student[];
}

const DashboardStats = ({ students }: DashboardStatsProps) => {
  // Get user role from context
  const { userRole } = useAuth();

  return (
    <div className="space-y-8">
      <OverviewCards students={students} />

      {/* Conditional chart rendering based on user role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") && <SchoolDistributionChart students={students} />}
        {userRole === "school" && <DepartmentDistributionChart students={students} />}
        {userRole === "department" && <ProgramDistributionChart students={students} />}
        <GraduationYearChart students={students} />
      </div>

      {/* All Departments Distribution in its own row for admin and alumni-manager */}
      {(userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") && (
        <div className="hidden md:block">
          <DepartmentChart students={students} />
        </div>
      )}

      <ProgrammeAnalytics students={students} />
    </div>
  );
};

export default DashboardStats;
