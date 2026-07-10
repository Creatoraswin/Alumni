"use client";

import React, { useState, useEffect } from "react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

// Icons
import { Check, Trash2, Search, Loader2, Edit, Save, Database, RefreshCw, AlertCircle, Mail, Phone, Linkedin, GraduationCap, Building2, BookOpen } from "lucide-react";

// Local Components
import { useAdminData } from "@/components/AdminLayout";
import { useAuth } from "@/contexts/useAuth"; // Import useAuth to access refreshData
import FilterSection from "./FilterSection";
import RobustImage from "./RobustImage";
import CustomDatePicker from "./CustomDatePicker";

// Services and Types
import { Student, updateStudentData, fetchStudentsData, deleteStudentData, getDirectImageUrl, StudentStrength } from "@/services/apiService";
import { UserRole } from "@/contexts/auth-context";
import { analyticsDataCache } from "@/services/analyticsDataCache";
import { fetchAcademicInfo, AcademicInfo } from "@/services/apiService";

// Date utilities
import { formatDateForDisplay, formatDateForSubmission } from "@/lib/dateUtils";
import { YEARS } from "@/lib/constants";

interface ApprovalTabProps {
  students: Student[];
  onStudentUpdate: (student: Student) => void;
  userRole?: UserRole;
  currentStudent?: Student | null;
}

// Helper function to determine student's current status
const getCurrentStatus = (student: Student): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  // First check if student already has a currentJob value
  if (student.currentJob) {
    if (student.currentJob.toLowerCase() === "higher study") {
      return { label: "Higher Studies", variant: "secondary" };
    } else if (student.currentJob.toLowerCase() === "job") {
      return { label: "Job", variant: "default" };
    } else if (student.currentJob.toLowerCase() !== "na") {
      // If it's something else but not NA, use that value
      return { label: student.currentJob, variant: "default" };
    }
  }

  // If no currentJob or it's NA, compute based on fields
  // Check for Higher Studies Information
  const hasHigherStudies =
    student.universityName &&
    student.universityName !== "NA" &&
    student.universityName.trim() !== "" &&
    student.areaOfStudy &&
    student.areaOfStudy !== "NA" &&
    student.areaOfStudy.trim() !== "" &&
    student.location &&
    student.location !== "NA" &&
    student.location.trim() !== "";

  // Check for Professional Information
  const hasProfessionalInfo =
    (student.organisation &&
      student.organisation !== "NA" &&
      student.organisation.trim() !== "") ||
    (student.designation &&
      student.designation !== "NA" &&
      student.designation.trim() !== "");

  if (hasHigherStudies) {
    return { label: "Higher Studies", variant: "secondary" };
  } else if (hasProfessionalInfo) {
    return { label: "Job", variant: "default" };
  } else {
    return { label: "NA", variant: "destructive" };
  }
};

const ApprovalTab = (props: ApprovalTabProps) => {
  const adminData = useAdminData();
  const authContext = useAuth(); // Get auth context to access refreshData
  const isAdmin = props.userRole === "admin" || props.userRole === "alumni-manager";
  const isStrictAdmin = props.userRole === "admin"; // Only true admin, not alumni-manager
  const students = props.students ?? (isAdmin ? adminData.students : []);
  const onStudentUpdate = props.onStudentUpdate ?? (isAdmin ? (updatedStudent: Student) => adminData.setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s)) : undefined);

  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");

  // Edit functionality state
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Student>>({});
  const [saving, setSaving] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Student strength database state
  const [studentStrengthData, setStudentStrengthData] = useState<StudentStrength[]>([]);
  const [studentStrengthRegNos, setStudentStrengthRegNos] = useState<Set<string>>(new Set());
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // Academic data state
  const [academicData, setAcademicData] = useState<AcademicInfo[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    // Immediately upload so the URL is ready when saving
    try {
      setUploadingPhoto(true);
      const { uploadImageToDrive } = await import('@/services/apiService');
      const url = await uploadImageToDrive(file, 'student_photo', editedData.registrationNo);
      setEditedData(prev => ({ ...prev, photoUrl: url }));
      setPhotoPreview("");
      URL.revokeObjectURL(preview);
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setUploadingPhoto(false);
      setPhotoFile(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      if (authContext && typeof authContext.refreshData === 'function') {
        await authContext.refreshData(true); // Force refresh
      } else {
        const freshStudents = await fetchStudentsData(true);
        if (isAdmin && adminData.setStudents) {
          adminData.setStudents(freshStudents);
        }
      }
      toast({
        title: "Refreshed",
        description: "Pending approvals data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch student strength data and academic data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingDb(true);
        const data = await analyticsDataCache.getData();
        setStudentStrengthData(data.studentStrength);

        // Create a set of normalized registration numbers for quick lookup
        const regNos = new Set(
          data.studentStrength
            .filter(s => s["Registration No."] && String(s["Registration No."]).trim() !== "")
            .map(s => String(s["Registration No."]).trim().toLowerCase())
        );
        setStudentStrengthRegNos(regNos);
        // Also fetch academic data
        const academicData = await fetchAcademicInfo();
        setAcademicData(academicData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingDb(false);
      }
    };

    loadData();
  }, []);

  const uniqueSchools = Array.from(new Set(academicData.map(a => a.school)));
  const uniqueDepartments = editedData.school
    ? Array.from(new Set(academicData.filter(a => (a.school || "").toLowerCase() === (editedData.school || "").toLowerCase()).map(a => a.department)))
    : [];
  const uniqueProgrammes = editedData.department
    ? Array.from(new Set(academicData.filter(a =>
      (a.school || "").toLowerCase() === (editedData.school || "").toLowerCase() &&
      (a.department || "").toLowerCase() === (editedData.department || "").toLowerCase()
    ).map(a => a.programme)))
    : [];


  // Helper function to check if student is in database
  const isStudentInDatabase = (registrationNo: string): boolean => {
    if (!registrationNo) return false;
    const normalizedRegNo = registrationNo.toString().trim().toLowerCase();
    return studentStrengthRegNos.has(normalizedRegNo);
  };

  // Filter students with empty or 'Pending' Status field
  const pendingApprovalStudents = students.filter(student => {
    // More robust checking for pending status
    const status = student.Status;

    // Handle different possible values - check for all variations that might indicate pending status
    if (status === undefined || status === null) {
      return true;
    }

    if (typeof status === 'string') {
      const trimmedStatus = status.trim().toLowerCase();

      // Check for empty string or pending status
      // Include students with empty status, 'pending', 'pending approval', 'under review' as pending
      // Exclude students with 'approved' or 'rejected' status
      const isApproved = trimmedStatus === 'approved';
      const isRejected = trimmedStatus === 'rejected';
      const isPending = !isApproved && !isRejected;

      return isPending;
    }

    // For any other type, treat as pending (to be safe)
    return true;
  });

  // Filter students based on search term and other filters
  const filteredStudents = pendingApprovalStudents.filter(student => {
    const search = searchTerm.toLowerCase();
    const matchesYear = selectedYear === "all" || student.graduationYear === selectedYear;
    const matchesSchool = selectedSchool === "all" || student.school === selectedSchool;
    const matchesProgramme = selectedProgramme === "all" || student.programme === selectedProgramme;

    const matchesSearch = search === "" ||
      (typeof student.registrationNo === 'string' && student.registrationNo.toLowerCase().includes(search)) ||
      (typeof student.name === 'string' && student.name.toLowerCase().includes(search)) ||
      (typeof student.email === 'string' && student.email.toLowerCase().includes(search)) ||
      (typeof student.school === 'string' && student.school.toLowerCase().includes(search)) ||
      (typeof student.department === 'string' && student.department.toLowerCase().includes(search)) ||
      (typeof student.programme === 'string' && student.programme.toLowerCase().includes(search)) ||
      (typeof student.currentPosition === 'string' && student.currentPosition.toLowerCase().includes(search)) ||
      (typeof student.organisation === 'string' && student.organisation.toLowerCase().includes(search));

    const result = matchesYear && matchesSchool && matchesProgramme && matchesSearch;

    return result;
  });

  // Sort students: Job/Higher study students first, then "NA" students at bottom, finally by Timestamp
  const sortedStudents = [...filteredStudents].sort((a, b) => {
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

  // Handle edit student
  const handleEditStudent = (studentId: string) => {
    // Block edit functionality for non-admin roles
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit alumni records.",
        variant: "destructive",
      });
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (student) {
      setEditingStudent(studentId);
      setEditedData(student);
    } else {
      toast({
        title: "Error",
        description: "Student not found.",
        variant: "destructive",
      });
    }
  };

  // Handle save student
  const handleSaveStudent = async () => {
    try {
      setSaving(true);
      setSuccessMessage(null); // Clear previous success messages
      if (!editedData || !editedData.registrationNo) {
        toast({
          title: "Error",
          description: "Missing student registration number.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: "Saving changes...",
        description: "Please wait while we update the alumni details.",
      });

      // Compute the student's current status
      const computedStatus = getCurrentStatus(editedData as Student).label;
      // Map "Higher Studies" to "Higher study" to match the SignUp form
      const statusForSheet = computedStatus === "Higher Studies" ? "Higher study" : computedStatus;

      // Construct a full payload with all required Student fields
      const fullPayload: Student = {
        id: editedData.id || "",
        registrationNo: editedData.registrationNo || "",
        name: editedData.name || "",
        email: editedData.email || "",
        personalEmail: editedData.personalEmail || "",
        phone: editedData.phone || "",
        school: editedData.school || "",
        programme: editedData.programme || "",
        graduationYear: editedData.graduationYear || "",
        designation: editedData.designation || "",
        currentPosition: statusForSheet, // Use computed status
        currentDesignation: editedData.currentDesignation || editedData.designation || "",
        organisation: editedData.organisation || "",
        placeOfWork: editedData.placeOfWork || "",
        areaOfInterest: editedData.areaOfInterest || "",
        location: editedData.location || "",
        universityName: editedData.universityName || "",
        areaOfStudy: editedData.areaOfStudy || "",
        dob: formatDateForSubmission(editedData.dob || ""),
        linkedinId: editedData.linkedinId || "",
        photoUrl: editedData.photoUrl || "",
        address: editedData.address || "",
        feedback: editedData.feedback || "",
        department: editedData.department || "",
        skills: Array.isArray(editedData.skills) ? editedData.skills : (editedData.skills ? [editedData.skills] : []),
        Timestamp: editedData.Timestamp || new Date().toISOString(),
        Status: editedData.Status || "Pending", // Include Status field
        currentJob: statusForSheet, // Also update currentJob for consistency
        currentjob: statusForSheet // Also update currentjob for consistency
      };

      await updateStudentData(fullPayload, "admin");

      // Force refresh all students from backend with showAll=true to get fresh data
      if (authContext && typeof authContext.refreshData === 'function') {
        await authContext.refreshData(true); // Force refresh
      } else {
        // Fallback to direct fetch if refreshData is not available
        const freshStudents = await fetchStudentsData(true);
        if (isAdmin && adminData.setStudents) {
          adminData.setStudents(freshStudents);
        }
      }

      setSuccessMessage("Alumni data updated successfully!");
      if (onStudentUpdate) {
        onStudentUpdate(fullPayload);
      }

      setTimeout(() => setSuccessMessage(null), 3000);
      setEditingStudent(null);
      setEditedData({});

      toast({
        title: "Alumni updated!",
        description: "The changes have been saved and are now visible.",
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to update alumni data.";
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditedData({});
  };

  // Handle approve student
  const handleApproveStudent = async (studentId: string) => {
    try {
      setProcessingId(studentId);
      const student = students.find(s => s.id === studentId);
      if (!student) {
        toast({
          title: "Error",
          description: "Student not found.",
          variant: "destructive",
        });
        return;
      }

      // Compute the student's current status
      const computedStatus = getCurrentStatus(student).label;
      // Map "Higher Studies" to "Higher study" to match the SignUp form
      const statusForSheet = computedStatus === "Higher Studies" ? "Higher study" : computedStatus;

      // Create minimal update with Status field and computed currentPosition
      const updatedStudent: Partial<Student> = {
        registrationNo: student.registrationNo,
        Status: "Approved",
        currentPosition: statusForSheet, // Include computed status
        currentJob: statusForSheet, // Also update currentJob for consistency
        currentjob: statusForSheet // Also update currentjob for consistency
      };

      await updateStudentData(updatedStudent as Student, "admin");

      // Force refresh all students from backend with showAll=true to get fresh data
      // Clear the cache first to ensure we get fresh data
      if (authContext && typeof authContext.refreshData === 'function') {
        await authContext.refreshData(true); // Force refresh
      } else {
        // Fallback to direct fetch if refreshData is not available
        const freshStudents = await fetchStudentsData(true);
        if (isAdmin && adminData.setStudents) {
          adminData.setStudents(freshStudents);
        }
      }

      setSuccessMessage(`${student.name} has been approved successfully!`);
      if (onStudentUpdate) {
        onStudentUpdate(updatedStudent as Student);
      }

      toast({
        title: "Student Approved",
        description: `${student.name} has been approved successfully.`,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to approve student.";
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId: string) => {
    try {
      setProcessingId(studentId);
      const student = students.find(s => s.id === studentId);
      if (!student) {
        toast({
          title: "Error",
          description: "Student not found.",
          variant: "destructive",
        });
        return;
      }

      await deleteStudentData(student);

      // Re-fresh the entire student list
      // Force refresh all students from backend with showAll=true to get fresh data
      if (authContext && typeof authContext.refreshData === 'function') {
        await authContext.refreshData(true); // Force refresh
      } else {
        // Fallback to direct fetch if refreshData is not available
        const freshStudents = await fetchStudentsData(true);
        if (isAdmin && adminData.setStudents) {
          adminData.setStudents(freshStudents);
        }
      }

      // Trigger parent update if needed
      if (onStudentUpdate) {
        onStudentUpdate({ ...student, _delete: true });
      }

      toast({
        title: "Student Deleted",
        description: `${student.name} has been deleted successfully.`
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to delete student.";
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <Card>
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl text-foreground bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-center font-semibold shadow-lg animate-fade-in-up">
          <div className="flex items-center justify-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gradient-primary">Pending Approvals</h2>
            <p className="text-muted-foreground mt-1">Review and manage alumni profile submissions</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="bg-primary/10 px-4 py-2 rounded-full">
              <span className="text-sm font-bold text-primary">
                {sortedStudents.length} {sortedStudents.length === 1 ? 'student' : 'students'} pending approval
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Sticky and horizontally scrollable FilterSection Bar on mobile */}
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md shadow-lg rounded-b-none rounded-t-lg px-0 py-0 mb-6 w-full overflow-x-auto whitespace-nowrap border-b border-primary/20">
          <FilterSection
            students={pendingApprovalStudents}
            filteredStudents={filteredStudents}
            selectedYear={selectedYear}
            selectedSchool={selectedSchool}
            selectedProgramme={selectedProgramme}
            searchTerm={searchTerm}
            onYearChange={setSelectedYear}
            onSchoolChange={setSelectedSchool}
            onProgrammeChange={setSelectedProgramme}
            onSearchChange={setSearchTerm}
            onClearFilters={() => {
              setSearchTerm("");
              setSelectedSchool("all");
              setSelectedYear("all");
              setSelectedProgramme("all");
            }}
          />
        </div>

        {sortedStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedStudents.map((student, index) => (
              <div
                key={`${student.id}-${index}`}
                className="border rounded-xl p-5 relative bg-gradient-to-b from-card to-card/95 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 card-enhanced overflow-hidden cursor-pointer group border-primary/10 shadow-soft"
                onClick={() => setViewingStudent(student)}
              >
                {/* Database Status Indicator in Top-Right Corner */}
                {isLoadingDb ? (
                  <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-muted/20 backdrop-blur-sm border border-muted-foreground/30 shadow-sm animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : isStudentInDatabase(student.registrationNo) ? (
                  <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-green-500/10 backdrop-blur-sm border border-green-500/30 shadow-sm hover:scale-110 transition-transform" title="In DB">
                    <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 backdrop-blur-sm border border-red-500/30 shadow-sm hover:scale-110 transition-transform" title="Not in DB">
                    <Database className="h-4 w-4 text-red-500" />
                  </div>
                )}

                {/* Header with photo and basic info */}
                <div className="flex items-start space-x-4 mb-4 pr-12">
                  <div className="flex-shrink-0">
                    <RobustImage
                      photoUrl={student.photoUrl}
                      studentName={student.name}
                      size="md"
                      className="rounded-xl border-2 border-primary/20 group-hover:border-primary/50 transition-all duration-300 shadow-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-extrabold text-xl text-foreground group-hover:text-primary transition-colors leading-tight">
                      {student.name}
                    </h3>
                    <div className="flex">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/25">
                        Reg: {student.registrationNo || '-'}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md border border-secondary-foreground/10">
                        {student.programme || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Academic Information (School & Department in One Row) */}
                <div className="border-t border-primary/15 pt-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                    <span className="font-semibold text-foreground/90">
                      <span className="hidden md:inline text-muted-foreground/80 font-normal mr-0.5">School: </span>
                      {student.school || 'N/A'}
                    </span>
                  </div>
                  <span className="text-muted-foreground/30 select-none hidden xs:inline">•</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                    <span className="font-semibold text-foreground/90">
                      <span className="hidden md:inline text-muted-foreground/80 font-normal mr-0.5">Dept: </span>
                      {student.department || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Contact Box (Phone, Mail, LinkedIn) */}
                <div className="p-4 rounded-xl bg-secondary/20 border border-primary/10 space-y-2.5 shadow-sm">
                  <div className="flex items-center text-xs gap-2.5 min-w-0">
                    <Phone className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                    <span className="text-foreground font-semibold break-all">{student.phone || '-'}</span>
                  </div>
                  <div className="flex items-center text-xs gap-2.5 min-w-0">
                    <Mail className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                    <span className="text-foreground font-semibold break-all">{student.email || '-'}</span>
                  </div>
                  {student.linkedinId && student.linkedinId !== "NA" && student.linkedinId !== "Not specified" ? (
                    <div className="flex items-center text-xs gap-2.5 pt-2 border-t border-primary/10 mt-1.5">
                      <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] flex-shrink-0" />
                      <a
                        href={student.linkedinId.startsWith('http') ? student.linkedinId : `https://linkedin.com/in/${student.linkedinId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-bold flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-muted-foreground/60 gap-2.5 pt-2 border-t border-primary/10 mt-1.5">
                      <Linkedin className="h-3.5 w-3.5 text-muted-foreground/45 flex-shrink-0" />
                      <span className="italic font-medium">No LinkedIn profile</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            {searchTerm ? (
              <>
                <Search className="h-12 w-12 mx-auto mb-4" />
                <p>No pending approvals found matching "{searchTerm}"</p>
              </>
            ) : (
              <>
                <Check className="h-12 w-12 mx-auto mb-4" />
                <p>No pending approvals</p>
                <p className="text-sm mt-2">If you believe this is incorrect, check the browser console for any errors.</p>
              </>
            )}
          </div>
        )}

        {/* Edit Dialog - Properly positioned using shadcn/ui defaults */}
        <Dialog open={!!editingStudent} onOpenChange={(open) => {
          if (!open) handleCancelEdit();
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Alumni: {students.find(s => s.id === editingStudent)?.name || 'Unknown'}</DialogTitle>
              <DialogDescription>
                Make changes to the alumni's details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
              {/* Photo section at the top */}
              <div className="flex flex-col items-center gap-4 p-6 bg-secondary/10 rounded-xl">
                <div className="relative">
                  <RobustImage
                    photoUrl={photoPreview || editedData.photoUrl || ''}
                    studentName={editedData.name || ''}
                    size="lg"
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all shadow-md">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? 'Uploading...' : (editedData.photoUrl ? 'Change Photo' : 'Upload Photo')}
                </label>
                <div className="text-center">
                  <h3 className="font-bold text-xl">{editedData.name || 'Alumni Name'}</h3>
                  <p className="text-muted-foreground">{editedData.programme || 'Programme'}</p>
                </div>
              </div>

              {/* Student Status in Edit Dialog */}
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="text-sm font-medium">Current Status:</span>
                <Badge variant={getCurrentStatus(editedData as Student).variant}>
                  {getCurrentStatus(editedData as Student).label}
                </Badge>
              </div>

              {/* Form fields in a responsive grid with better spacing and organization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                {/* Personal Information Section */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-primary/20 text-primary">Personal Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNo" className="font-medium">
                    Registration No.
                  </Label>
                  <Input
                    id="registrationNo"
                    value={editedData.registrationNo || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, registrationNo: e.target.value }))}
                    className="h-10 bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={editedData.name || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={editedData.email || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalEmail" className="font-medium">
                    Personal Email
                  </Label>
                  <Input
                    id="personalEmail"
                    value={editedData.personalEmail || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, personalEmail: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={editedData.phone || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="font-medium">
                    Date of Birth
                  </Label>
                  <CustomDatePicker
                    value={editedData.dob || ""}
                    onChange={(date) => setEditedData(prev => ({ ...prev, dob: date }))}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="font-medium">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={editedData.address || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, address: e.target.value }))}
                    className="h-10"
                  />
                </div>

                {/* Academic Information Section */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-primary/20 text-primary">Academic Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school" className="font-medium">
                    School
                  </Label>
                  <select
                    id="school"
                    value={uniqueSchools.find(s => s.toLowerCase() === (editedData.school || "").toLowerCase()) || editedData.school || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, school: e.target.value, department: "", programme: "" }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select School</option>
                    {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="font-medium">
                    Department
                  </Label>
                  {uniqueDepartments.length > 0 ? (
                    <select
                      id="department"
                      value={uniqueDepartments.find(d => d.toLowerCase() === (editedData.department || "").toLowerCase()) || editedData.department || ""}
                      onChange={(e) => setEditedData(prev => ({ ...prev, department: e.target.value, programme: "" }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select Department</option>
                      {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <Input
                      id="department"
                      value={editedData.department || ""}
                      onChange={(e) => setEditedData(prev => ({ ...prev, department: e.target.value }))}
                      className="h-10"
                      placeholder="Enter department"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="programme" className="font-medium">
                    Programme
                  </Label>
                  {uniqueProgrammes.length > 0 ? (
                    <select
                      id="programme"
                      value={uniqueProgrammes.find(p => p.toLowerCase() === (editedData.programme || "").toLowerCase()) || editedData.programme || ""}
                      onChange={(e) => setEditedData(prev => ({ ...prev, programme: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select Programme</option>
                      {uniqueProgrammes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <Input
                      id="programme"
                      value={editedData.programme || ""}
                      onChange={(e) => setEditedData(prev => ({ ...prev, programme: e.target.value }))}
                      className="h-10"
                      placeholder="Enter programme"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduationYear" className="font-medium">
                    Graduation Year
                  </Label>
                  <select
                    id="graduationYear"
                    value={editedData.graduationYear || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, graduationYear: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>


                {/* Professional Information Section */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-primary/20 text-primary">Professional Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation" className="font-medium">
                    Designation
                  </Label>
                  <Input
                    id="designation"
                    value={editedData.designation || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, designation: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organisation" className="font-medium">
                    Organisation
                  </Label>
                  <Input
                    id="organisation"
                    value={editedData.organisation || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, organisation: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeOfWork" className="font-medium">
                    Place of Work
                  </Label>
                  <Input
                    id="placeOfWork"
                    value={editedData.placeOfWork || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, placeOfWork: e.target.value }))}
                    className="h-10"
                  />
                </div>

                {/* Higher Studies Information Section */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-primary/20 text-primary">Higher Studies Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="universityName" className="font-medium">
                    University Name
                  </Label>
                  <Input
                    id="universityName"
                    value={editedData.universityName || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, universityName: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaOfStudy" className="font-medium">
                    Area of Study
                  </Label>
                  <Input
                    id="areaOfStudy"
                    value={editedData.areaOfStudy || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, areaOfStudy: e.target.value }))}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-medium">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={editedData.location || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, location: e.target.value }))}
                    className="h-10"
                  />
                </div>

                {/* Additional Information Section */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-primary/20 text-primary">Additional Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaOfInterest" className="font-medium">
                    Area of Interest
                  </Label>
                  <Input
                    id="areaOfInterest"
                    value={editedData.areaOfInterest || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, areaOfInterest: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills" className="font-medium">
                    Skills
                  </Label>
                  <Input
                    id="skills"
                    value={Array.isArray(editedData.skills) ? editedData.skills.join(', ') : ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0) }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinId" className="font-medium">
                    LinkedIn ID/URL
                  </Label>
                  <Input
                    id="linkedinId"
                    value={editedData.linkedinId || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, linkedinId: e.target.value }))}
                    className="h-10"
                    placeholder="Enter LinkedIn ID or full URL"
                  />
                  {editedData.linkedinId && (
                    <p className="text-sm text-muted-foreground">
                      Preview: <a
                        href={editedData.linkedinId.startsWith('http') ? editedData.linkedinId : `https://linkedin.com/in/${editedData.linkedinId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Profile
                      </a>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoUrl" className="font-medium">
                    Photo URL
                  </Label>
                  <Input
                    id="photoUrl"
                    value={editedData.photoUrl || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, photoUrl: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback" className="font-medium">
                    Feedback
                  </Label>
                  <Input
                    id="feedback"
                    value={editedData.feedback || ""}
                    onChange={(e) => setEditedData(prev => ({ ...prev, feedback: e.target.value }))}
                    className="h-10"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2 justify-end pt-4 border-t border-primary/20">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="bg-gradient-to-r from-secondary to-secondary/80 text-foreground font-bold shadow-glow hover:scale-105 border-0 rounded-xl"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={handleSaveStudent}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-primary/80 text-white font-bold shadow-glow hover:scale-105 border-0 rounded-xl"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="ml-1">Save Changes</span>
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detailed View Dialog */}
        <Dialog open={!!viewingStudent} onOpenChange={(open) => {
          if (!open) setViewingStudent(null);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <DialogTitle className="text-2xl font-bold text-gradient-primary">
                  Alumni Profile Details
                </DialogTitle>
                <div>
                  {viewingStudent && (
                    isStudentInDatabase(viewingStudent.registrationNo) ? (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 flex items-center gap-1 px-2.5 py-1 font-medium shadow-sm">
                        <Database className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span>Verified in Database</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 flex items-center gap-1 px-2.5 py-1 font-medium shadow-sm">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        <span>Not in Database</span>
                      </Badge>
                    )
                  )}
                </div>
              </div>
              <DialogDescription>
                Review full details for this applicant below.
              </DialogDescription>
            </DialogHeader>

            {viewingStudent && (
              <div className="space-y-6 py-4">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-secondary/10 rounded-xl border border-primary/10">
                  <RobustImage
                    photoUrl={viewingStudent.photoUrl}
                    studentName={viewingStudent.name}
                    size="lg"
                    className="rounded-xl border-2 border-primary/20"
                  />
                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="text-xl font-bold">{viewingStudent.name}</h3>
                    <p className="text-primary font-medium">{viewingStudent.programme}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                      <Badge variant="secondary" className="px-2.5 py-1">
                        Reg: {viewingStudent.registrationNo || 'N/A'}
                      </Badge>
                      <Badge variant="outline" className="px-2.5 py-1">
                        Graduation: {viewingStudent.graduationYear || 'N/A'}
                      </Badge>
                      <Badge variant={getCurrentStatus(viewingStudent).variant} className="px-2.5 py-1">
                        {getCurrentStatus(viewingStudent).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Academic & Basic Info */}
                  <div className="space-y-3 p-4 rounded-xl bg-card border border-primary/5 shadow-sm">
                    <h4 className="font-bold text-sm text-primary border-b border-primary/10 pb-1.5 flex items-center">
                      <span className="w-2.5 h-2.5 bg-primary rounded-full mr-2"></span>
                      Academic & Personal Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">School:</span>
                        <span className="text-right font-semibold">{viewingStudent.school || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Department:</span>
                        <span className="text-right font-semibold">{viewingStudent.department || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Date of Birth:</span>
                        <span className="text-right font-semibold">{formatDateForDisplay(viewingStudent.dob) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Submission Time:</span>
                        <span className="text-right font-semibold">{viewingStudent.Timestamp ? new Date(viewingStudent.Timestamp).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3 p-4 rounded-xl bg-card border border-primary/5 shadow-sm">
                    <h4 className="font-bold text-sm text-primary border-b border-primary/10 pb-1.5 flex items-center">
                      <span className="w-2.5 h-2.5 bg-primary rounded-full mr-2"></span>
                      Contact Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center min-w-0">
                        <span className="text-muted-foreground font-medium flex-shrink-0">Email:</span>
                        <span className="font-semibold truncate max-w-[200px]" title={viewingStudent.email}>{viewingStudent.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center min-w-0">
                        <span className="text-muted-foreground font-medium flex-shrink-0">Personal Email:</span>
                        <span className="font-semibold truncate max-w-[200px]" title={viewingStudent.personalEmail}>{viewingStudent.personalEmail || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Phone:</span>
                        <span className="font-semibold">{viewingStudent.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center min-w-0">
                        <span className="text-muted-foreground font-medium flex-shrink-0">LinkedIn:</span>
                        <span className="font-semibold truncate max-w-[200px]">
                          {viewingStudent.linkedinId && viewingStudent.linkedinId !== "NA" && viewingStudent.linkedinId !== "Not specified" ? (
                            <a
                              href={viewingStudent.linkedinId.startsWith('http') ? viewingStudent.linkedinId : `https://linkedin.com/in/${viewingStudent.linkedinId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View Profile
                            </a>
                          ) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Info */}
                  {(getCurrentStatus(viewingStudent).label !== "NA" || isAdmin) && (
                    <div className="space-y-3 p-4 rounded-xl bg-card border border-primary/5 shadow-sm">
                      <h4 className="font-bold text-sm text-primary border-b border-primary/10 pb-1.5 flex items-center">
                        <span className="w-2.5 h-2.5 bg-primary rounded-full mr-2"></span>
                        Professional Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Organisation:</span>
                          <span className="text-right font-semibold">{viewingStudent.organisation || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Designation:</span>
                          <span className="text-right font-semibold">{viewingStudent.designation || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Location:</span>
                          <span className="text-right font-semibold">{viewingStudent.location || viewingStudent.placeOfWork || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Academic Studies (if applicable) */}
                  {(getCurrentStatus(viewingStudent).label !== "NA" || isAdmin) && (
                    <div className="space-y-3 p-4 rounded-xl bg-card border border-primary/5 shadow-sm">
                      <h4 className="font-bold text-sm text-primary border-b border-primary/10 pb-1.5 flex items-center">
                        <span className="w-2.5 h-2.5 bg-primary rounded-full mr-2"></span>
                        Higher Studies Info
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">University:</span>
                          <span className="text-right font-semibold">{viewingStudent.universityName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Area of Study:</span>
                          <span className="text-right font-semibold">{viewingStudent.areaOfStudy || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills/Interests & Address */}
                <div className="space-y-4">
                  {viewingStudent.areaOfInterest && viewingStudent.areaOfInterest !== "NA" && viewingStudent.areaOfInterest !== "Not specified" && (
                    <div className="p-4 rounded-xl bg-card border border-primary/5 shadow-sm">
                      <h4 className="font-bold text-sm text-primary mb-2 flex items-center">
                        <span className="w-2.5 h-2.5 bg-primary rounded-full mr-2"></span>
                        Skills & Interests
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingStudent.areaOfInterest.split(',').map((skill, i) => (
                          <span key={i} className="text-xs bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground px-3 py-1 rounded-full font-medium shadow-sm">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingStudent.address && viewingStudent.address !== "NA" && viewingStudent.address !== "Not specified" && (
                    <div className="p-4 rounded-xl bg-card border border-primary/5 shadow-sm">
                      <h4 className="font-bold text-sm text-primary mb-2 flex items-center">
                        <span className="w-2.5 h-2.5 bg-primary rounded-full mr-2"></span>
                        Address
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium">{viewingStudent.address}</p>
                    </div>
                  )}

                  {isAdmin && viewingStudent.feedback && viewingStudent.feedback !== "NA" && viewingStudent.feedback !== "Not specified" && (
                    <div className="p-4 rounded-xl bg-card border border-primary/5 shadow-sm">
                      <h4 className="font-bold text-sm text-primary mb-2 flex items-center">
                        <span className="w-2.5 h-2.5 bg-primary rounded-full mr-2"></span>
                        Feedback / Remarks
                      </h4>
                      <p className="text-sm italic text-foreground/80 leading-relaxed">{viewingStudent.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Dialog Footer Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-primary/10">
                  {isStrictAdmin && (
                    <Button
                      variant="outline"
                      className="bg-red-500 hover:bg-red-600 text-white font-bold shadow-md border-0 rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
                      onClick={() => {
                        const id = viewingStudent.id;
                        setViewingStudent(null);
                        handleDeleteStudent(id);
                      }}
                      disabled={processingId === viewingStudent.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-md border-0 rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
                    onClick={() => {
                      const id = viewingStudent.id;
                      setViewingStudent(null);
                      handleEditStudent(id);
                    }}
                    disabled={editingStudent === viewingStudent.id}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>

                  <Button
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-md border-0 rounded-xl px-5 py-2 flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
                    onClick={() => {
                      const id = viewingStudent.id;
                      setViewingStudent(null);
                      handleApproveStudent(id);
                    }}
                    disabled={processingId === viewingStudent.id}
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="rounded-xl px-4 py-2 border border-primary/20 text-foreground font-semibold"
                    onClick={() => setViewingStudent(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ApprovalTab;