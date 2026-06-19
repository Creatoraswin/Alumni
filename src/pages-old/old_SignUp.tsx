"use client";


import React, { useState, useCallback, useEffect } from 'react';
import { registerStudent, fetchStudentsData } from "@/services/apiService";
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/useAuth";
import UniversalNav from "@/components/UniversalNav";
import { formatDateForSubmission } from "@/lib/dateUtils";

const SCHOOLS = [
  "SoPAHS",
  "SoET",
  "SoM"
];

const PROGRAMMES = [
  "B.Sc Radiology & Imaging Technology",
  "B.Sc Anaesthesia & Operation Theatre Technology",
  "B.Sc Optometry",
  "B.Sc Forensic Sciences",
  "B.Tech in Mechanical Engineering (Industry Integrated)",
  "B.Tech in Mechanical Engineering (Addictive Manufacturing)",
  "B.Tech in Mechanical Engineering (Automobile)",
  "B.Tech in Mechanical Engineering",
  "B.Tech in CSE (Data Science and Machine Learning)",
  "B.Tech in CSE (Information Technology)",
  "B.Tech in CSE (Software Engineering)",
  "B.Tech in CSE (IOT & Cyber Security with Block Chain Technology)",
  "B.Tech in CSE (Computer Networking)",
  "B.Tech in CSE (Data Science)",
  "B.Tech in CSE (Bioscience and Bioengineering)",
  "B.Tech in CSE (Customer Experience (CX))",
  "B.Tech in CSE (Multimedia & Metaverse)",
  "B-Tech in CSE (Engineering and Product Development)",
  "B-Tech in CSE (Robotics and Automation)",
  "B.Tech in CSE (Artificial Intelligence and Machine Learning)",
  "B-Tech CSE (AWS)",
  "B.Tech in CSE",
  "MCA",
  "BCA",
  "B.Tech in ECE (Industry Integrated)",
  "B.Tech in ECE (Bio Medical)",
  "B.Tech in ECE (Embedded Systems)",
  "B.Tech in ECE (VLSI &Chip Design)",
  "B.Tech in ECE",
  "BBA",
  "M. Tech",
  "PhD",
  "B-Tech in CSE (AR/VR)",
  "Other…"
];

const YEARS = ["2025", "2024", "2023", "2022", "2021", "2020"];

type FormState = {
  school: string;
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
  mobile: string;
  dob: string;
  linkedin: string;
  photo: File | null;
  address: string;
  feedback: string;
  universityName?: string;
  location?: string;
};

const initialState: FormState = {
  school: "",
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
  mobile: "",
  dob: "",
  linkedin: "",
  photo: null,
  address: "",
  feedback: "",
  universityName: "",
  location: "",
};

type StudentStatus = "Job" | "Higher study" | "NA";

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
  const router = useRouter();
  const { students, loading: studentsLoading } = useAuth();

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
      }));
      return;
    }
    if (type === "file") {
      const fileInput = e.target as HTMLInputElement;
      setForm((prev) => ({
        ...prev,
        [name]: fileInput.files && fileInput.files[0] ? fileInput.files[0] : null,
      }));
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
    // Email: basic format
    if (!form.email) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address (e.g., user@example.com).";
    }
    ["school", "programme", "graduationYear", "name", "dob", "photo", "address", "feedback"].forEach((field) => {
      if (!form[field as keyof FormState]) newErrors[field] = "Required.";
    });
    // Status-specific validation
    if (studentStatus === "Job") {
      ["currentPosition", "designation", "organisation", "placeOfWork"].forEach((field) => {
        if (!form[field as keyof FormState]) newErrors[field] = "Required.";
      });
    } else if (studentStatus === "Higher study") {
      ["areaOfStudy", "universityName", "location"].forEach((field) => {
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
        // Photo upload is disabled for now
        // Prepare form for submission based on status and NA logic
        const submitForm = { ...form };
        const naFields: (keyof Omit<FormState, 'photo'>)[] = [
          "currentPosition", "designation", "organisation", "placeOfWork", "location", "universityName", "areaOfInterest", "areaOfStudy"
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
        if (studentStatus === "Job") {
          submitForm.currentPosition = undefined;
        }
        if (studentStatus === "Higher study") {
          if (!submitForm.location) submitForm.location = "NA";
          if (!submitForm.universityName) submitForm.universityName = "NA";
          if (!submitForm.areaOfStudy) submitForm.areaOfStudy = "NA";
        }
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
          email: submitForm.email,
          mobile: submitForm.mobile,
          dob: formatDateForSubmission(submitForm.dob),
          linkedin: submitForm.linkedin,
          photo: submitForm.photo, // Include the photo file
          address: submitForm.address,
          feedback: submitForm.feedback,
        };
        await registerStudent(payload, setUploadingImage);
        setSubmitted(true);
      } catch (err) {
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
  }, [submitted, navigate]);

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
                    <label className="block font-semibold">Personal Email id *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} className={`w-full border rounded p-2 focus:ring-2 focus:ring-primary ${errors.email ? 'border-destructive bg-destructive/10' : 'border-input'}`} required />
                    {errors.email && <span className="text-destructive text-xs">{errors.email}</span>}
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
                      {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.school && <span className="text-destructive text-xs">{errors.school}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold">Programme *</label>
                    <select name="programme" value={form.programme} onChange={handleChange} className="w-full border rounded p-2" required>
                      <option value="">Select Programme</option>
                      {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
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
                  <div>
                    <label className="block font-semibold">LinkedIn Id</label>
                    <input name="linkedin" value={form.linkedin} onChange={handleChange} className="w-full border rounded p-2" />
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
