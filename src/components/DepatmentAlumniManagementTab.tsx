"use client";

import React, { useState } from "react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

// Icons
import { Edit, Save, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Local Components
import { useAdminData } from "@/components/AdminLayout";
import FilterSection from "./FilterSection";
import RobustImage from "./RobustImage";
import CustomDatePicker from "./CustomDatePicker";

// Services and Types
import { Student, updateStudentData, fetchStudentsData, getDirectImageUrl } from "@/services/apiService";
import { UserRole } from "@/contexts/auth-context";

// Date utilities
import { formatDateForDisplay, formatDateForSubmission } from "@/lib/dateUtils";

interface AlumniManagementTabProps {
  students: Student[];
  onStudentUpdate: (student: Student) => void;
  userRole?: UserRole;
  currentStudent?: Student | null;
}

const DepatmentAlumniManagementTab = (props: AlumniManagementTabProps) => {
  const router = useRouter();
  const adminData = useAdminData();
  const isAdmin = props.userRole === "admin";
  const students = props.students ?? (isAdmin ? adminData.students : []);
  const onStudentUpdate = props.onStudentUpdate ?? (isAdmin ? (updatedStudent: Student) => adminData.setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s)) : undefined);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Student>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const handleEditStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setEditingStudent(studentId);
      setEditedData(student);
    }
  };

  const handleSaveStudent = async () => {
    try {
      setSaving(true);
      setShowSuccess(false);
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
      // Construct a full payload with all required Student fields
      const fullPayload: Student = {
        id: editedData.id || "",
        registrationNo: editedData.registrationNo || "",
        name: editedData.name || "",
        email: editedData.email || "",
        phone: editedData.phone || "",
        school: editedData.school || "",
        programme: editedData.programme || "",
        graduationYear: editedData.graduationYear || "",
        designation: editedData.designation || "",
        currentPosition: editedData.currentPosition || "",
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
        currentJob: editedData.currentPosition || "",
        currentjob: editedData.currentPosition || ""
      };
      // Map department and school roles to admin for API call
      const apiUserRole = (props.userRole === "department" || props.userRole === "school") ? "admin" : (props.userRole || "student");
      await updateStudentData(fullPayload, apiUserRole as "student" | "admin");
      // Update the students data in the context instead of re-fetching
      if (isAdmin && adminData.setStudents) {
        // Create a copy of the current students array
        const updatedStudents = adminData.students.map(student => 
          student.id === fullPayload.id ? fullPayload : student
        );
        // Update the context with the modified array
        adminData.setStudents(updatedStudents);
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setEditingStudent(null);
        setEditedData({});
      }, 1500); // Show success for 1.5s, then close
      setSuccessMessage("Alumni data updated successfully!");
      if (onStudentUpdate) {
        onStudentUpdate(fullPayload);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
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

  // Filter students based on search term and filters
  const filteredStudents = sortedStudents.filter(student => {
    const matchesYear = selectedYear === "all" || student.graduationYear === selectedYear;
    const matchesSchool = selectedSchool === "all" || student.school === selectedSchool;
    const matchesProgramme = selectedProgramme === "all" || student.programme === selectedProgramme;
    const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment;
    
    const search = searchTerm.toLowerCase();
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
    <Card>
      {successMessage && (
        <div className="mb-4 p-3 rounded-lg text-green-900 bg-green-100 border border-green-300 text-center font-semibold">
          {successMessage}
        </div>
      )}
      <CardHeader>
        <div></div>
      </CardHeader>
      <CardContent>
        {/* Sticky and horizontally scrollable FilterSection Bar on mobile */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow rounded-b-none rounded-t-lg px-0 py-0 mb-4 w-full overflow-x-auto whitespace-nowrap">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student, index) => (
            // Removed hover-lift class to fix white on hover issue
            (<div
              key={`${student.id}-${index}`}
              onClick={() => router.push(`/alumni-directory/detail?id=${student.registrationNo}`)}
              className="border rounded-lg p-4 relative bg-card card-enhanced cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* Edit button at top right - only show for department admin */}
              {props.userRole === "department" && (
                <Button size="sm" variant="outline" onClick={() => handleEditStudent(student.id)} className="absolute top-2 right-2 z-10">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              <div className="flex items-center space-x-4 mb-4">
                <RobustImage 
                  photoUrl={student.photoUrl}
                  studentName={student.name}
                  size="md"
                />
                <div>
                  <h3 className="font-bold text-lg text-foreground">{student.name}</h3>
                  <p className="text-muted-foreground">{student.programme}</p>
                  <p className="text-muted-foreground text-sm">Reg. No: <span className="font-medium">{student.registrationNo || '-'}</span></p>
                  <p className="text-muted-foreground text-sm">Graduation Year: <span className="font-medium">{student.graduationYear || '-'}</span></p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2 p-3 rounded-lg bg-secondary/30">
                  <p className="truncate"><span className="font-medium">Email:</span> {student.email || '-'}</p>
                  <p className="truncate"><span className="font-medium">Phone:</span> {student.phone || '-'}</p>
                  <p className="truncate"><span className="font-medium">DOB:</span> {formatDateForDisplay(student.dob)}</p>
                  <p className="truncate"><span className="font-medium">Address:</span> {student.address ? student.address.substring(0, 30) + (student.address.length > 30 ? '...' : '') : '-'}</p>
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-secondary/30">
                  <p className="truncate"><span className="font-medium">Current Position:</span> {student.currentPosition || '-'}</p>
                  <p className="truncate"><span className="font-medium">Organisation:</span> {student.organisation || '-'}</p>
                  <p className="truncate"><span className="font-medium">Location:</span> {student.location || student.placeOfWork || '-'}</p>
                  <p className="truncate"><span className="font-medium">LinkedIn:</span> {student.linkedinId && student.linkedinId !== "NA" && student.linkedinId !== "Not specified" ? (
                    <a 
                      href={student.linkedinId.startsWith('http') ? student.linkedinId : `https://linkedin.com/in/${student.linkedinId}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline"
                    >
                      View Profile
                    </a>
                  ) : 'Not provided'}</p>
                </div>
              </div>
              {/* Skills/Interests */}
              <div className="mt-2">
                <p className="text-sm font-bold text-gradient-primary">Skills/Interests:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {student.areaOfInterest && student.areaOfInterest !== "NA" && student.areaOfInterest !== "Not specified" ? (
                    student.areaOfInterest.split(',').map((skill, i) => (
                      <span key={i} className="text-xs bg-gradient-secondary text-dark px-2 py-1 rounded-full font-semibold shadow-soft">
                        {skill.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Not specified</span>
                  )}
                </div>
              </div>
            </div>)
          ))}
          
          {filteredStudents.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <p>No alumni found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
        {/* Edit Modal - Only shown for department admin */}
        <Dialog open={!!editingStudent && props.userRole === "department"} onOpenChange={open => { if (!open) handleCancelEdit(); }}>
          <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Alumni</DialogTitle>
              <DialogDescription>Update alumni details and save changes.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <RobustImage 
                  photoUrl={editedData.photoUrl || ''}
                  studentName={editedData.name || ''}
                  size="md"
                />
                <div>
                  <h3 className="font-semibold text-lg">{editedData.name}</h3>
                  <p className="text-gray-600">{editedData.programme}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Department admin fields */}
                {props.userRole === "department" && ([
                    { label: "Name", key: "name", editable: false, readonly: true, type: "text" },
                    { label: "Email", key: "email", editable: false, readonly: true, type: "email" },
                    { label: "Phone", key: "phone", editable: false, readonly: true, type: "tel" },
                    { label: "School", key: "school", editable: false, readonly: true },
                    { label: "Programme", key: "programme", editable: false, readonly: true },
                    { label: "Graduation Year", key: "graduationYear", editable: false, readonly: true },
                    { label: "Designation", key: "designation", editable: false, readonly: true },
                    { label: "Location", key: "location", editable: false, readonly: true },
                    { label: "LinkedIn ID", key: "linkedinId", editable: false, readonly: true },
                    { 
                      label: "Date of Birth", 
                      key: "dob", 
                      format: formatDateForDisplay, 
                      editable: false, 
                      readonly: true,
                      type: "date"
                    },
                    { label: "Address", key: "address", editable: false, readonly: true },
                    { label: "Current Job", key: "currentPosition", editable: true, readonly: false },
                    { label: "Organisation", key: "organisation", editable: true, readonly: false },
                    { label: "Photo URL", key: "photoUrl", editable: false, readonly: true },
                    { label: "Department", key: "department", editable: false, readonly: true },
                    { label: "Area of Study", key: "areaOfStudy", editable: false, readonly: true },
                    { label: "University Name", key: "universityName", editable: false, readonly: true },
                    { label: "Area of Interest", key: "areaOfInterest", editable: false, readonly: true },
                    { label: "Skills (comma separated)", key: "skills", format: (skills: unknown) => Array.isArray(skills) ? skills.join(', ') : '', editable: false, readonly: true },
                    { label: "Registration No", key: "registrationNo", editable: false, readonly: true }
                  ].map(field => {
                    // Special handling for date field - but it's readonly for department
                    if (field.key === "dob" && field.type === "date") {
                      return (
                        <div key={field.key}>
                          <label className="block text-sm font-medium mb-1">{field.label}</label>
                          <div className="p-2 bg-gray-100 border rounded-md text-gray-600 min-h-[36px] flex items-center">
                            {formatDateForDisplay(editedData[field.key] as string) || '-'}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={field.key}>
                        <label className="block text-sm font-medium mb-1">{field.label}</label>
                        {(field.key === 'name' || field.key === 'email' || field.key === 'phone') ? (
                          <div className="p-2 bg-gray-100 border rounded-md text-gray-600 min-h-[36px] flex items-center">
                            {typeof editedData[field.key] === 'string' ? editedData[field.key] : ''}
                          </div>
                        ) : (
                          <Input
                            value={field.format ? field.format(editedData[field.key]) : (typeof editedData[field.key] === 'string' ? editedData[field.key] : '')}
                            onChange={field.editable ? (e) => setEditedData({ ...editedData, [field.key]: e.target.value }) : undefined}
                            readOnly={field.readonly}
                            disabled={field.readonly}
                            type={field.type || 'text'}
                            className={`${field.readonly ? "bg-gray-100 cursor-not-allowed" : ""} h-[36px]`}
                          />
                        )}
                      </div>
                    );
                  }))}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>Cancel</Button>
                <Button onClick={handleSaveStudent} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DepatmentAlumniManagementTab;