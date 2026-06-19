"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { registerStudent, fetchStudentsData, testApiConnectivity, testImageUploadEndpoint, testUploadFunctionality } from "@/services/apiService";
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/useAuth";
import UniversalNav from "@/components/UniversalNav";
import { formatDateForSubmission } from "@/lib/dateUtils";

import { YEARS } from "@/lib/constants";
import { fetchAcademicInfo, AcademicInfo } from "@/services/apiService";

// Define MAX_UPLOAD_ATTEMPTS constant

type FormState = {
  school: string;
  department: string;
  programme: string;
  graduationYear: string;
  name: string;
  registrationNo: string;
  currentPosition: string; // was 'occupation'
  designation: string;
  organisation: string;
  placeOfWork: string;
  areaOfInterest: string;
  areaOfStudy?: string; // <-- add this
  email: string;
  personalEmail: string;
  mobile: string;
  dob: string;
  linkedin: string;
  photo: File | string | null;
  address: string;
  feedback: string;
  universityName?: string;
  location?: string;
  // Entrepreneurship fields
  startupName?: string;
  startupDomain?: string;
  yearOfEstablishment?: string;
};

const initialState: FormState = {
  school: "",
  department: "",
  programme: "",
  graduationYear: "",
  name: "",
  registrationNo: "",
  currentPosition: "",
  designation: "",
  organisation: "",
  placeOfWork: "",
  areaOfInterest: "",
  areaOfStudy: "", // <-- add this
  email: "",
  personalEmail: "",
  mobile: "",
  dob: "",
  linkedin: "",
  photo: null,
  address: "",
  feedback: "",
  universityName: "",
  location: "",
};

// Move refs inside the component
type StudentStatus = "Job" | "Higher study" | "Entrepreneurship" | "NA";

const SignUp = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [studentStatus, setStudentStatus] = useState<StudentStatus>("NA");
  const [checkingReg, setCheckingReg] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [regNumberError, setRegNumberError] = useState("");
  const [isCheckingRegNumber, setIsCheckingRegNumber] = useState(false);
  const [academicData, setAcademicData] = useState<AcademicInfo[]>([]);
  const router = useRouter();
  const { students, loading: studentsLoading } = useAuth();
  
  // Track upload attempts
  const uploadAttemptsRef = useRef(0);
  const lastUploadSuccessRef = useRef(false);
  const MAX_UPLOAD_ATTEMPTS = 2;
  
  // Track upload attempts in a separate function
  const trackUploadAttempt = (attempt: number, success: boolean) => {
    uploadAttemptsRef.current = attempt;
    lastUploadSuccessRef.current = success;
    // Update the UI to show attempts
    const attemptText = document.getElementById('upload-attempts');
    if (attemptText) {
      attemptText.textContent = `Attempt ${attempt} of ${MAX_UPLOAD_ATTEMPTS}`;
      if (success) {
        attemptText.style.color = 'green';
        attemptText.textContent = `Successfully uploaded on attempt ${attempt}`;
      } else {
        attemptText.style.color = 'red';
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === "studentStatus") {
      setStudentStatus(value as StudentStatus);
      // Reset related fields when status changes
      setForm((prev) => ({
        ...prev,
        currentPosition: "",
        designation: "",
        organisation: "",
        placeOfWork: "",
        areaOfInterest: "",
        universityName: "",
        location: "",
        areaOfStudy: "",
        startupName: "",
        startupDomain: "",
        yearOfEstablishment: "",
      }));
      return;
    }
    if (type === "file") {
      const fileInput = e.target as HTMLInputElement;
      setForm((prev) => ({
        ...prev,
        [name]: fileInput.files && fileInput.files[0] ? fileInput.files[0] : null,
      }));
      
      // Show upload attempt tracking
      const attemptText = document.getElementById('upload-attempts');
      if (attemptText) {
        attemptText.textContent = `Attempt 1 of ${MAX_UPLOAD_ATTEMPTS}`;
        attemptText.style.color = 'red';
      }
    } else if (name === "school") {
      setForm((prev) => ({ ...prev, school: value, department: "", programme: "" }));
    } else if (name === "department") {
      setForm((prev) => ({ ...prev, department: value, programme: "" }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Check registration number uniqueness in real-time
    if (name === "registrationNo" && value.length === 12) {
      debouncedCheckRegNumber(value);
    } else if (name === "registrationNo") {
      setRegNumberError("");
    }
  };

  const checkRegistrationNumberUniqueness = async (regNumber: string) => {
    if (regNumber.length !== 12) return;
    
    setIsCheckingRegNumber(true);
    setRegNumberError("");
    
    try {
      const allStudents = await fetchStudentsData(true); // Get all students including pending/rejected
      const isDuplicate = allStudents.some(s => s.registrationNo === regNumber);
      
      if (isDuplicate) {
        setRegNumberError("This registration number is already registered in our system.");
      }
    } catch (error) {
      setRegNumberError("Unable to verify registration number. Please try again.");
    } finally {
      setIsCheckingRegNumber(false);
    }
  };

  // Debounced version to avoid too many API calls
  const debouncedCheckRegNumber = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (regNumber: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          checkRegistrationNumberUniqueness(regNumber);
        }, 500); // Wait 500ms after user stops typing
      };
    })(),
    []
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    // Registration number: 12 digits only
    if (!form.registrationNo) {
      newErrors.registrationNo = "Registration number is required.";
    } else if (!/^\d+$/.test(form.registrationNo)) {
      newErrors.registrationNo = "Registration number must contain only numbers (no letters or special characters).";
    } else if (form.registrationNo.length !== 12) {
      newErrors.registrationNo = "Registration number must be exactly 12 digits long.";
    } else if (regNumberError) {
      newErrors.registrationNo = "Please fix the registration number error above.";
    }
    // Mobile: 10 digits only
    if (!form.mobile) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!/^\d+$/.test(form.mobile)) {
      newErrors.mobile = "Mobile number must contain only numbers (no letters or special characters).";
    } else if (form.mobile.length !== 10) {
      newErrors.mobile = "Mobile number must be exactly 10 digits long.";
    }
    // Email: at least one email is required
    if (!form.email && !form.personalEmail) {
      newErrors.email = "At least one email address is required.";
      newErrors.personalEmail = "At least one email address is required.";
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address (e.g., user@example.com).";
    }
    if (form.personalEmail && !/^\S+@\S+\.\S+$/.test(form.personalEmail)) {
      newErrors.personalEmail = "Please enter a valid email address (e.g., user@example.com).";
    }
    // LinkedIn ID: now mandatory
    if (!form.linkedin) {
      newErrors.linkedin = "LinkedIn ID is required.";
    } else if (!form.linkedin.startsWith('https://')) {
      newErrors.linkedin = "Please enter a valid LinkedIn URL starting with https://";
    }
    // Required fields validation
    ["school", "programme", "graduationYear", "name", "dob", "address", "feedback"].forEach((field) => {
      if (!form[field as keyof FormState]) newErrors[field] = "Required.";
    });
    // Photo validation - allow string URLs or File objects
    if (!form.photo) {
      newErrors.photo = "Required.";
    } else if (form.photo instanceof File) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(form.photo.type)) {
        newErrors.photo = "Invalid file type. Please select a JPEG, PNG, or GIF image.";
      }
      // Validate file size (limit to 5MB)
      if (form.photo.size > 5 * 1024 * 1024) {
        newErrors.photo = "File size too large. Please select an image smaller than 5MB.";
      }
    } else if (typeof form.photo === 'string') {
      // Validate URL format
      const isValidUrl = form.photo.match(/^https?:\/\/.+\.(jpeg|jpg|gif|png|bmp|webp)(\?.*)?$/i) ||
                      form.photo.includes('googleusercontent.com') ||
                      form.photo.includes('drive.google.com');
      if (!isValidUrl) {
        newErrors.photo = "Invalid image URL. Please provide a valid image URL or upload a file.";
      }
    }
    // Status-specific validation
    if (studentStatus === "Job") {
      ["designation", "organisation", "placeOfWork"].forEach((field) => {
        if (!form[field as keyof FormState]) newErrors[field] = "Required.";
      });
    } else if (studentStatus === "Higher study") {
      ["areaOfStudy", "universityName", "location"].forEach((field) => {
        if (!form[field as keyof FormState]) newErrors[field] = "Required.";
      });
    } else if (studentStatus === "Entrepreneurship") {
      ["startupName", "startupDomain", "yearOfEstablishment"].forEach((field) => {
        if (!form[field as keyof FormState]) newErrors[field] = "Required.";
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (validate()) {
      setLoading(true);
      setCheckingReg(true);
      try {
        // Check registration number uniqueness against all students (including pending/rejected)
        const allStudents = await fetchStudentsData(true); // true to get all students
        if (allStudents.some(s => s.registrationNo === form.registrationNo)) {
          setSubmitError("Registration number already exists. Please use a different registration number or contact support if you believe this is an error.");
          setLoading(false);
          setCheckingReg(false);
          return;
        }
        
        // Prepare form for submission based on status and NA logic
        const submitForm = { ...form };
        const naFields: (keyof Omit<FormState, 'photo'>)[] = [
          "currentPosition", "designation", "organisation", "placeOfWork", "location", "universityName", "areaOfInterest", "areaOfStudy", "startupName", "startupDomain", "yearOfEstablishment"
        ];
        naFields.forEach(field => {
          const value = submitForm[field];
          if (
            (value === undefined || value === null || value === "") &&
            (typeof value === 'string' || value === undefined || value === null)
          ) {
            (submitForm[field] as string | undefined) = "NA";
          }
        });
        
        // Format DOB using centralized utility
        
        // Explicit mapping for payload
        const payload = {
          school: submitForm.school,
          programme: submitForm.programme,
          graduationYear: submitForm.graduationYear,
          name: submitForm.name,
          registrationNo: submitForm.registrationNo,
          // Send the value of the Current Status dropdown to the Google Sheet column 'Current Position'
          currentPosition: studentStatus,
          designation: studentStatus === 'Job' ? submitForm.designation : 'NA',
          organisation: studentStatus === 'Job' ? submitForm.organisation : 'NA',
          placeOfWork: studentStatus === 'Job' ? submitForm.placeOfWork : 'NA',
          areaOfInterest: studentStatus === 'Job' ? submitForm.areaOfInterest : 'NA',
          areaOfStudy: studentStatus === 'Higher study' ? submitForm.areaOfStudy : 'NA',
          universityName: studentStatus === 'Higher study' ? submitForm.universityName : 'NA',
          location: studentStatus === 'Higher study' ? submitForm.location : 'NA',
          startupName: studentStatus === 'Entrepreneurship' ? submitForm.startupName : 'NA',
          startupDomain: studentStatus === 'Entrepreneurship' ? submitForm.startupDomain : 'NA',
          yearOfEstablishment: studentStatus === 'Entrepreneurship' ? submitForm.yearOfEstablishment : 'NA',
          email: submitForm.email,
          personalEmail: submitForm.personalEmail,
          mobile: submitForm.mobile,
          dob: formatDateForSubmission(submitForm.dob),
          linkedin: submitForm.linkedin,
          photo: submitForm.photo, // Include the photo file
          address: submitForm.address,
          feedback: submitForm.feedback,
        };
        console.log('Submitting payload:', payload); // Debug log
        
        await registerStudent(payload, setUploadingImage);
        setSubmitted(true);
      } catch (err) {
        console.error('Registration error:', err); // Debug log
        setSubmitError("Failed to register. Please try again later.");
      } finally {
        setLoading(false);
        setCheckingReg(false);
      }
    }
  };

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitted, router]);

  // Test API connectivity on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const isConnected = await testApiConnectivity();
        if (!isConnected) {
          console.warn('API connectivity test failed - this may cause upload issues');
        } else {
          console.log('API connectivity test passed');
        }
        
        // Also test the image upload endpoint
        const uploadEndpointWorking = await testImageUploadEndpoint();
        if (!uploadEndpointWorking) {
          console.warn('Image upload endpoint test failed - uploads may not work');
        } else {
          console.log('Image upload endpoint test passed');
        }
        
        // Test upload functionality
        await testUploadFunctionality();
      } catch (error) {
        console.warn('API connectivity test error:', error);
      }
    };
    
    const loadAcademicData = async () => {
      const data = await fetchAcademicInfo();
      setAcademicData(data);
    };

    testConnection();
    loadAcademicData();
  }, []);

  const uniqueSchools = Array.from(new Set(academicData.map(a => a.school)));
  const uniqueDepartments = form.school ? Array.from(new Set(academicData.filter(a => a.school === form.school).map(a => a.department))) : [];
  const uniqueProgrammes = form.department ? Array.from(new Set(academicData.filter(a => a.school === form.school && a.department === form.department).map(a => a.programme))) : [];


  if (submitted) {
    return <div className="max-w-xl mx-auto mt-10 p-6 bg-accent/20 rounded shadow text-center text-lg font-semibold text-foreground">Thank you for registering as an alumnus! Your response has been recorded.<br/>Redirecting to main page...</div>;
  }

  return (
    <>
      <UniversalNav isLoggedIn={false} userRole={null} currentStudent={null} onLoginClick={() => router.push('/?login=1')} onLogout={() => {}} />
      <div className="min-h-screen w-full flex flex-col items-center justify-center py-8 px-2 bg-secondary">
        <div className="w-full mt-24 mx-4 md:mx-32 my-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary">Alumni Registration</h1>
            <p className="mt-2 text-base md:text-lg text-foreground font-medium">Join the CUTMAP Alumni Network and stay connected with your batchmates and university!</p>
          </div>
          <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 md:p-10 md:mx-16 lg:mx-32">
            <Tabs defaultValue="registration" className="w-full">
              <TabsList className="w-full flex mb-6">
                <TabsTrigger value="registration" className="flex-1">Registration</TabsTrigger>
                <TabsTrigger value="instructions" className="flex-1">Instructions</TabsTrigger>
              </TabsList>
              <TabsContent value="registration">
                <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 text-left">
                  {submitError && <div className="sm:col-span-2 xl:col-span-4 bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-center w-full">{submitError}</div>}
                  <div>
                    <label className="block font-semibold">Name of the Student *</label>
                    <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded p-2" required />
                    {errors.name && <span className="text-destructive text-xs">{errors.name}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold">Registration No. (12 digits)*</label>
                    <div className="relative">
                      <input 
                        name="registrationNo" 
                        value={form.registrationNo} 
                        onChange={handleChange} 
                        className={`w-full border rounded p-2 focus:ring-2 focus:ring-primary ${
                          errors.registrationNo || regNumberError ? 'border-destructive bg-destructive/10' : 'border-input'
                        }`} 
                        required 
                      />
                      {isCheckingRegNumber && (
                        <div className="absolute right-2 top-2">
                          {/* <span className="animate-spin text-blue-500">⏳</span> */}
                        </div>
                      )}
                    </div>
                    {errors.registrationNo && <span className="text-destructive text-xs">{errors.registrationNo}</span>}
                    {regNumberError && <span className="text-destructive text-xs">{regNumberError}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold">Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} className={`w-full border rounded p-2 focus:ring-2 focus:ring-primary ${errors.email ? 'border-destructive bg-destructive/10' : 'border-input'}`} />
                    {errors.email && <span className="text-destructive text-xs">{errors.email}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold">Personal Email</label>
                    <input name="personalEmail" type="email" value={form.personalEmail} onChange={handleChange} className={`w-full border rounded p-2 focus:ring-2 focus:ring-primary ${errors.personalEmail ? 'border-destructive bg-destructive/10' : 'border-input'}`} />
                    {errors.personalEmail && <span className="text-destructive text-xs">{errors.personalEmail}</span>}
                    <span className="text-xs text-muted-foreground mt-1 block">At least one email is required</span>
                  </div>
                  <div>
                    <label className="block font-semibold">Mobile No. *</label>
                    <input name="mobile" value={form.mobile} onChange={handleChange} className={`w-full border rounded p-2 focus:ring-2 focus:ring-primary ${errors.mobile ? 'border-destructive bg-destructive/10' : 'border-input'}`} required />
                    {errors.mobile && <span className="text-destructive text-xs">{errors.mobile}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold">DOB *</label>
                    <input name="dob" type="date" value={form.dob} onChange={handleChange} className="w-full border rounded p-2" required />
                    {errors.dob && <span className="text-destructive text-xs">{errors.dob}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold">School *</label>
                    <select name="school" value={form.school} onChange={handleChange} className="w-full border rounded p-2" required>
                      <option value="">Select School</option>
                      {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.school && <span className="text-destructive text-xs">{errors.school}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold">Department *</label>
                    <select name="department" value={form.department} onChange={handleChange} className="w-full border rounded p-2" required disabled={!form.school}>
                      <option value="">Select Department</option>
                      {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold">Programme *</label>
                    <select name="programme" value={form.programme} onChange={handleChange} className="w-full border rounded p-2" required disabled={!form.department}>
                      <option value="">Select Programme</option>
                      {uniqueProgrammes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.programme && <span className="text-destructive text-xs">{errors.programme}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold">Year of Graduation *</label>
                    <select name="graduationYear" value={form.graduationYear} onChange={handleChange} className="w-full border rounded p-2" required>
                      <option value="">Select Year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {errors.graduationYear && <span className="text-destructive text-xs">{errors.graduationYear}</span>}
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="block font-semibold">Current Status *</label>
                    <select name="studentStatus" value={studentStatus} onChange={handleChange} className="w-full border rounded p-2" required>
                      <option value="Job">Job (Placement)</option>
                      <option value="Higher study">Higher study</option>
                      <option value="Entrepreneurship">Entrepreneurship</option>
                      <option value="NA">NA</option>
                    </select>
                  </div>
                  {/* Job Fields */}
                  {studentStatus === "Job" && (
                    <>
                      <div>
                        <label className="block font-semibold">Current Position *</label>
                        <input name="currentPosition" value={form.currentPosition} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.currentPosition && <span className="text-destructive text-xs">{errors.currentPosition}</span>}
                      </div>
                      <div>
                        <label className="block font-semibold">Designation *</label>
                        <input name="designation" value={form.designation} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.designation && <span className="text-destructive text-xs">{errors.designation}</span>}
                      </div>
                      <div>
                        <label className="block font-semibold">Name of the Organisation *</label>
                        <input name="organisation" value={form.organisation} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.organisation && <span className="text-destructive text-xs">{errors.organisation}</span>}
                      </div>
                      <div>
                        <label className="block font-semibold">Place of work *</label>
                        <input name="placeOfWork" value={form.placeOfWork} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.placeOfWork && <span className="text-destructive text-xs">{errors.placeOfWork}</span>}
                      </div>
                    </>
                  )}
                  {/* Higher Study Fields */}
                  {studentStatus === "Higher study" && (
                    <>
                      {/* <div>
                        <label className="block font-semibold">Place *</label>
                        <input name="studyPlace" value={form.studyPlace || ""} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.studyPlace && <span className="text-destructive text-xs">{errors.studyPlace}</span>}
                      </div> */}
                      <div>
                        <label className="block font-semibold">Area of Study *</label>
                        <input name="areaOfStudy" value={form.areaOfStudy || ""} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.areaOfStudy && <span className="text-destructive text-xs">{errors.areaOfStudy}</span>}
                      </div>
                      <div>
                        <label className="block font-semibold">University Name *</label>
                        <input name="universityName" value={form.universityName || ""} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.universityName && <span className="text-destructive text-xs">{errors.universityName}</span>}
                      </div>
                      <div>
                        <label className="block font-semibold">Location *</label>
                        <input name="location" value={form.location || ""} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.location && <span className="text-destructive text-xs">{errors.location}</span>}
                      </div>
                    </>
                  )}
                  {/* Entrepreneurship Fields */}
                  {studentStatus === "Entrepreneurship" && (
                    <>
                      <div>
                        <label className="block font-semibold">Startup Name *</label>
                        <input name="startupName" value={form.startupName || ""} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.startupName && <span className="text-destructive text-xs">{errors.startupName}</span>}
                      </div>
                      <div>
                        <label className="block font-semibold">Startup Domain *</label>
                        <input name="startupDomain" value={form.startupDomain || ""} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.startupDomain && <span className="text-destructive text-xs">{errors.startupDomain}</span>}
                      </div>
                      <div>
                        <label className="block font-semibold">Year of Establishment *</label>
                        <input name="yearOfEstablishment" value={form.yearOfEstablishment || ""} onChange={handleChange} className="w-full border rounded p-2" required />
                        {errors.yearOfEstablishment && <span className="text-destructive text-xs">{errors.yearOfEstablishment}</span>}
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block font-semibold">LinkedIn Id *</label>
                    <div className="relative">
                      <input 
                        name="linkedin" 
                        value={form.linkedin} 
                        onChange={handleChange} 
                        className={`w-full border rounded p-2 focus:ring-2 focus:ring-primary pr-20 ${errors.linkedin ? 'border-destructive bg-destructive/10' : 'border-input'}`} 
                        required 
                        placeholder="https://www.linkedin.com/in/yourname"
                      />
                      {form.linkedin && (
                        <a 
                          href={form.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                          title="View LinkedIn Profile"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3v9zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66V19z"/>
                          </svg>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          // Open LinkedIn profile section in a new tab/window
                          window.open('https://www.linkedin.com/in/', '_blank', 'noopener,noreferrer');
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white rounded p-1 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Open LinkedIn to copy your profile URL"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M14 4.5V7h3.5L11 13.5l1.5 1.5L19 8.5V12h2V4.5h-7zM5 9.5v7H3v-7h2zm-1-2H2v11h2v-11zm15 0v11h2v-11h-2zm-1 2h-2v7h2v-7z"/>
                        </svg>
                      </button>

                    </div>
                    {errors.linkedin && <span className="text-destructive text-xs">{errors.linkedin}</span>}
                    <p className="text-xs text-gray-500 mt-1">Please enter your full LinkedIn profile URL (e.g., https://www.linkedin.com/in/yourname)</p>
                    <p className="text-xs text-blue-600 mt-1">Tip: Click the icon to open LinkedIn and copy your profile URL</p>
                  </div>
                  <div>
                    <label className="block font-semibold">Upload photo *</label>
                    <input name="photo" type="file" accept="image/*" onChange={handleChange} className="w-full border rounded p-2" required />
                    {errors.photo && <span className="text-destructive text-xs">{errors.photo}</span>}
                  </div>
                  <div className="sm:col-span-2 xl:col-span-2">
                    <label className="block font-semibold">Address *</label>
                    <textarea name="address" value={form.address} onChange={handleChange} className="w-full border rounded p-2 min-h-[80px] resize-y" required />
                    {errors.address && <span className="text-destructive text-xs">{errors.address}</span>}
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="block font-semibold">Share your Feedback of University *</label>
                    <textarea name="feedback" value={form.feedback} onChange={handleChange} className="w-full border rounded p-2" required />
                    {errors.feedback && <span className="text-destructive text-xs">{errors.feedback}</span>}
                  </div>
                  <div className="sm:col-span-2 xl:col-span-4">
                    <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-lg hover:bg-primary/90 transition text-lg flex items-center justify-center shadow-lg" disabled={loading || checkingReg || uploadingImage || isCheckingRegNumber || !!regNumberError}>
                      {(loading || checkingReg || uploadingImage || isCheckingRegNumber) ? <span className="animate-spin mr-2">⏳</span> : null}
                      {uploadingImage ? "Uploading Image..." : (loading || checkingReg) ? "Submitting..." : isCheckingRegNumber ? "Checking..." : "Submit"}
                    </button>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="instructions">
                <div className="p-4 text-foreground">
                  <h3 className="text-xl font-bold mb-2">Instructions</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Fill all required fields marked with *</li>
                    <li>Choose your current status and fill the relevant details</li>
                    <li><strong>Registration Number:</strong> Must be exactly 12 digits and unique.</li>
                    <li>Upload a clear photo</li>
                    <li>Contact support if you face any issues or believe there's an error with your registration number</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;