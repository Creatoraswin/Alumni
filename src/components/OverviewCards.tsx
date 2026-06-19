"use client";


import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Building, BookOpen, Calendar } from "lucide-react";
import { Student } from "@/services/apiService";

interface OverviewCardsProps {
  students: Student[];
}

const OverviewCards = ({ students }: OverviewCardsProps) => {

  // Filter to only include approved students with robust Status field checking
  const approvedStudents = students.filter(s => {
    // Handle null, undefined, or non-string Status values
    if (!s.Status || typeof s.Status !== 'string') return false;

    // Trim whitespace and compare case-insensitively
    const status = s.Status.trim().toLowerCase();
    return status === 'approved';
  });

  // Use currentJob for calculations
  const higherStudyStats = approvedStudents.filter(s => s.currentJob === "Higher study").length;
  const employmentStats = approvedStudents.filter(s => s.currentJob === "Job").length;
  const totalAlumni = approvedStudents.length;

  const schoolStats = approvedStudents.reduce((acc, student) => {
    acc[student.school] = (acc[student.school] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentStats = approvedStudents.reduce((acc, student) => {
    acc[student.department] = (acc[student.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const programmeStats = approvedStudents.reduce((acc, student) => {
    acc[student.programme] = (acc[student.programme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);


  const employmentRate = totalAlumni > 0 ? Math.round((employmentStats / (totalAlumni)) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 w-full">
      <Card className="gradient-primary text-white border-0 shadow-elegant hover-lift animate-fade-in-up min-w-0 flex-1 min-w-[180px] rounded-2xl" style={{ width: '100%', animationDelay: '0.1s' }}>
        <CardContent className="p-2 md:p-3">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div>
              <p className="text-white/80 text-sm md:text-base font-semibold">Total Alumni</p>
              <p className="text-3xl md:text-5xl font-bold tracking-tight">{totalAlumni}</p>
              <p className="text-white/70 text-xs md:text-sm mt-1 font-medium">Registered</p>
            </div>
            <div className="p-2 md:p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="gradient-secondary text-dark border-0 shadow-elegant hover-lift animate-fade-in-up min-w-0 flex-1 min-w-[180px] rounded-2xl" style={{ width: '100%', animationDelay: '0.2s' }}>
        <CardContent className="p-2 md:p-3">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div>
              <p className="text-dark/80 text-sm md:text-base font-semibold">Employment</p>
              <p className="text-3xl md:text-5xl font-bold tracking-tight">{employmentRate}%</p>
              <p className="text-dark/70 text-xs md:text-sm mt-1 font-medium">Success Rate</p>
            </div>
            <div className="p-2 md:p-3 bg-dark/20 rounded-2xl backdrop-blur-sm">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-dark" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Higher Study Card */}
      <Card className="gradient-accent text-dark border-0 shadow-elegant hover-lift animate-fade-in-up min-w-0 flex-1 min-w-[180px] rounded-2xl" style={{ width: '100%', animationDelay: '0.3s' }}>
        <CardContent className="p-2 md:p-3">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div>
              <p className="text-dark/80 text-sm md:text-base font-semibold">Higher Study</p>
              <p className="text-3xl md:text-5xl font-bold tracking-tight">{higherStudyStats}</p>
              <p className="text-dark/70 text-xs md:text-sm mt-1 font-medium">Pursuing</p>
            </div>
            <div className="p-2 md:p-3 bg-dark/20 rounded-2xl backdrop-blur-sm">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-dark" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0 shadow-elegant hover-lift animate-fade-in-up min-w-0 flex-1 min-w-[180px] rounded-2xl" style={{ width: '100%', animationDelay: '0.4s' }}>
        <CardContent className="p-2 md:p-3">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div>
              <p className="text-white/80 text-sm md:text-base font-semibold">Schools</p>
              <p className="text-3xl md:text-5xl font-bold tracking-tight">{Object.keys(schoolStats).length}</p>
              <p className="text-white/70 text-xs md:text-sm mt-1 font-medium">Active</p>
            </div>
            <div className="p-2 md:p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Building className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-dark border-0 shadow-elegant hover-lift animate-fade-in-up min-w-0 flex-1 min-w-[180px] rounded-2xl" style={{ width: '100%', animationDelay: '0.5s' }}>
        <CardContent className="p-2 md:p-3">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div>
              <p className="text-dark/80 text-sm md:text-base font-semibold">Departments</p>
              <p className="text-3xl md:text-5xl font-bold tracking-tight">{Object.keys(departmentStats).length}</p>
              <p className="text-dark/70 text-xs md:text-sm mt-1 font-medium">Available</p>
            </div>
            <div className="p-2 md:p-3 bg-dark/20 rounded-2xl backdrop-blur-sm">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-dark" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-accent to-accent/80 text-dark border-0 shadow-elegant hover-lift animate-fade-in-up min-w-0 flex-1 min-w-[180px] rounded-2xl" style={{ width: '100%', animationDelay: '0.6s' }}>
        <CardContent className="p-2 md:p-3">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div>
              <p className="text-dark/80 text-sm md:text-base font-semibold">Programmes</p>
              <p className="text-3xl md:text-5xl font-bold tracking-tight">{Object.keys(programmeStats).length}</p>
              <p className="text-dark/70 text-xs md:text-sm mt-1 font-medium">Available</p>
            </div>
            <div className="p-2 md:p-3 bg-dark/20 rounded-2xl backdrop-blur-sm">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-dark" />
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default OverviewCards;
