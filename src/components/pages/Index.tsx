"use client";

import { useState, useEffect } from "react";
import { useRouter as useNextRouter } from 'next/navigation';
import { useAuth } from "@/contexts/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import UniversalNav from "@/components/UniversalNav";
import FilterSection from "@/components/FilterSection";
import ProfileTab from "@/components/ProfileTab";
import StudentGrid from "@/components/StudentGrid";
import AuthModal from "@/components/AuthModal";
import AdminPanel from "@/components/AdminPanel";
import DashboardStats from "@/components/DashboardStats";
import ProfileEdit from "@/components/ProfileEdit";
import { fetchStudentsData, Student } from "@/services/apiService";
import { usePathname } from 'next/navigation';
import AnalyticsTab from "@/components/AnalyticsTab";

import { DepartmentUser } from "@/contexts/AuthContext";

const Index = () => {
  const pathname = usePathname();
  const nextRouter = useNextRouter();
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, setCurrentStudent, login, logout, students, setStudents, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('login=1')) {
      setIsAuthModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      if (userRole === "admin") nextRouter.replace("/admin");
      else if (userRole === "cadmin") nextRouter.replace("/cadmin");
      else if (userRole === "department") nextRouter.replace("/department");
      else if (userRole === "school") nextRouter.replace("/school");
    }
  }, [isLoggedIn, userRole, nextRouter]);

  // Sort students: Job/Higher study students first, then "NA" students at bottom, finally by Timestamp
  const sortedStudents = [...students].sort((a, b) => {
    // Helper function to check if student has complete job information
    const hasCompleteJobInfo = (student: Student) => {
      const hasOrganisation = student.organisation && 
        student.organisation !== "Not specified" && 
        student.organisation !== "NA" &&
        student.organisation.trim() !== "";
      
      const hasPosition = (student.currentPosition && 
        student.currentPosition !== "Not specified" && 
        student.currentPosition !== "NA" &&
        student.currentPosition.trim() !== "") ||
        (student.designation && 
        student.designation !== "Not specified" && 
        student.designation !== "NA" &&
        student.designation.trim() !== "");
      
      return hasOrganisation && hasPosition;
    };

    // Helper function to check if student has complete higher studies information
    const hasCompleteStudiesInfo = (student: Student) => {
      return (student.areaOfStudy && 
        student.areaOfStudy !== "Not specified" && 
        student.areaOfStudy !== "NA") &&
        (student.universityName &&
        student.universityName !== "Not specified" &&
        student.universityName !== "NA");
    };

    // Check completion status for both students
    const aHasJob = hasCompleteJobInfo(a);
    const aHasStudies = hasCompleteStudiesInfo(a);
    const aIsComplete = aHasJob || aHasStudies;

    const bHasJob = hasCompleteJobInfo(b);
    const bHasStudies = hasCompleteStudiesInfo(b);
    const bIsComplete = bHasJob || bHasStudies;

    // Primary sort: Complete info (job or studies) vs incomplete
    if (aIsComplete && !bIsComplete) return -1;
    if (!aIsComplete && bIsComplete) return 1;

    // Secondary sort: Within same completion status, prioritize job over studies
    if (aIsComplete && bIsComplete) {
      if (aHasJob && !bHasJob) return -1;
      if (!aHasJob && bHasJob) return 1;
    }

    // Tertiary sort: Timestamp (latest first)
    const dateA = a.Timestamp ? new Date(a.Timestamp) : new Date(0);
    const dateB = b.Timestamp ? new Date(b.Timestamp) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  // Apply role-based filtering for department and school users
  const roleFilteredStudents = sortedStudents.filter(student => {
    // Admin, cadmin and alumni-manager see all students
    if (userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") return true;
    
    // Department users see only their department's students
    if (userRole === "department" && currentDepartmentUser) {
      return student.department === currentDepartmentUser.department;
    }
    
    // School users see only their school's students
    if (userRole === "school" && currentDepartmentUser) {
      return student.school === currentDepartmentUser.department; // department field contains school name for school users
    }
    
    // Students and non-logged users see all
    return true;
  });

  const filteredStudents = roleFilteredStudents.filter(student => {
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

  const handleProfileSave = async (updatedStudent: Student) => {
    setSavingProfile(true);
    toast({
      title: "Saving profile...",
      description: "Please wait while we update your profile.",
    });
    try {
      // Update in Google Sheet
      const { updateStudentData } = await import("@/services/apiService");
      // Treat alumni-manager and cadmin the same as admin for update permissions
      const updateRole = (userRole === "department" || userRole === "school" || userRole === "alumni-manager" || userRole === "cadmin") 
        ? "admin" 
        : userRole || "student";
      await updateStudentData(updatedStudent, updateRole);
      // Re-fetch all students from backend
      const freshStudents = await fetchStudentsData();
      setStudents(freshStudents);
      // Optionally, update currentStudent if available
      const freshCurrent = freshStudents.find(s => s.id === updatedStudent.id);
      if (freshCurrent) {
        setCurrentStudent(freshCurrent);
      }
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved and are now visible.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogin = (role: "student" | "admin" | "department" | "school" | "alumni-manager" | "cadmin", student?: Student, departmentUser?: DepartmentUser) => {
    login(role, student, departmentUser);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSchool("all");
    setSelectedDepartment("all");
    setSelectedYear("all");
    setSelectedProgramme("all");
  };

  const handleStudentUpdate = (updatedStudent: Student) => {
    const updatedStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    setStudents(updatedStudents);
  };

  const getCurrentUserInfo = () => {
    if (currentStudent) {
      return {
        name: currentStudent.name,
        registrationNo: currentStudent.registrationNo,
        currentJob: currentStudent.currentPosition || '',
      };
    }
    return { name: '', registrationNo: '', currentJob: '' };
  };

  // Show loading only when we have no data at all (not even cached)
  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }

  if (pathname === "/analytics") {
    return (
      <div className="min-h-screen bg-background">
        <UniversalNav
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          currentStudent={currentStudent}
          currentDepartmentUser={currentDepartmentUser}
          onLoginClick={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <AnalyticsTab students={students} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        currentStudent={currentStudent}
        currentDepartmentUser={currentDepartmentUser}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Add top padding to account for fixed header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pt-16 md:pt-20">
        {isLoggedIn && (userRole === "admin" || userRole === "cadmin" || userRole === "department" || userRole === "school") ? null : (
          <>
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur shadow rounded-b-none rounded-t-lg px-0 py-0 mb-4">
              <FilterSection
                students={roleFilteredStudents}
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
            <StudentGrid 
              students={filteredStudents} 
              isLoggedIn={isLoggedIn} 
              loading={loading && students.length === 0} 
              currentUserInfo={getCurrentUserInfo()}
              userRole={userRole || undefined}
              onStudentDeleted={(deletedId) => {
                setStudents(students.filter((s: { id: string }) => s.id !== deletedId));
              }}
            />
          </>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />

      {currentStudent && (
        <ProfileEdit
          isOpen={isProfileEditOpen}
          onClose={() => setIsProfileEditOpen(false)}
          student={currentStudent}
          onSave={handleProfileSave}
        />
      )}
      {savingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-8 shadow-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="text-lg font-semibold text-primary">Saving your profile...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;