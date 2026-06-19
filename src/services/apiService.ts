import { ReactNode } from 'react';

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/Alumni%20next/backend/api";

// Interfaces
export interface Student {
  id: string;
  name: string;
  email: string;
  personalEmail?: string;
  phone: string;
  department: string;
  graduationYear: string;
  currentPosition: string;
  currentJob: string;
  currentCompany?: string;
  currentLocation?: string;
  currentRole?: string;
  currentDesignation: string | ReactNode;
  universityName: string;
  areaOfStudy: string;
  location: string;
  status?: string;
  Status?: string;
  _delete?: boolean;
  areaOfInterest: string;
  photoUrl: string;
  registrationNo: string;
  school: string;
  programme: string;
  organisation: string;
  designation: string;
  placeOfWork: string;
  linkedinId: string;
  dob: string;
  address: string;
  feedback: string;
  skills: string[];
  Timestamp: string;
  currentjob: string;
}

export interface StudentStrength {
  "Sl.No"?: string;
  "Registration No."?: string;
  "Name of the Student"?: string;
  "Batch"?: string;
  "Program"?: string;
  "Branch"?: string;
  "passout"?: string;
  registration_no?: string;
  name?: string;
  batch?: string;
  program?: string;
  branch?: string;
  passout_year?: number;
}

export interface AlumniSpotlightItem {
  id?: number;
  dateAdded: string;
  name: string;
  yearOfGraduation: string;
  school: string;
  department: string;
  registrationNo: string;
  currentPosition: string;
  company: string;
  photoUrl: string;
  achievement: string;
  galleryLink: string;
  status: string;
  rowIndex?: number;
}

export interface AlumniTalkItem {
  id?: number;
  date: string;
  name: string;
  school: string;
  department: string;
  registrationNo?: string;
  bannerPhotoUrl: string;
  talkon: string;
  reportUrl?: string;
  galleryLink?: string;
  rowIndex?: number;
}

export interface AlumniMeetItem {
  id?: number;
  date: string;
  place: string;
  description: string;
  bannerPhotoUrl: string;
  galleryLink: string;
  reportUrl?: string;
  rowIndex?: number;
}

// Utility: Transform PHP DB format to Frontend format for Student
const deriveDepartment = (programme: string): string => {
  if (!programme) return "NA";
  const p = programme.toLowerCase();
  if (p.includes("cse")) return "cse";
  if (p.includes("ece")) return "ece";
  if (p.includes("mechanical") || p.includes("mech")) return "mechanical";
  if (p.includes("radiology")) return "radiology";
  if (p.includes("optometry")) return "optometry";
  if (p.includes("anaesthesia") || p.includes("anesthesia")) return "anesthesia";
  if (p.includes("forensic")) return "forensic";
  if (p.includes("bba")) return "bba";
  return "NA";
};

const mapDbStudentToFrontend = (dbStudent: any): Student => {
  return {
    id: String(dbStudent.registration_no || ''),
    name: dbStudent.name || "NA",
    email: dbStudent.email || "NA",
    personalEmail: dbStudent.personal_email || "",
    phone: dbStudent.mobile_no || "NA",
    department: deriveDepartment(dbStudent.programme),
    graduationYear: String(dbStudent.year_of_graduation || "NA"),
    currentPosition: dbStudent.current_position || "NA",
    currentJob: dbStudent.present_occupation || "NA",
    currentCompany: dbStudent.organisation || "NA",
    currentLocation: dbStudent.location || "NA",
    currentDesignation: dbStudent.designation || "NA",
    universityName: dbStudent.university_name || "NA",
    areaOfStudy: dbStudent.area_of_study || "NA",
    location: dbStudent.location || "NA",
    areaOfInterest: dbStudent.area_of_interest || "NA",
    photoUrl: dbStudent.photo_url || "",
    registrationNo: String(dbStudent.registration_no || "NA"),
    school: dbStudent.school || "NA",
    programme: dbStudent.programme || "NA",
    designation: dbStudent.designation || "NA",
    organisation: dbStudent.organisation || "NA",
    placeOfWork: dbStudent.place_of_work || "NA",
    linkedinId: dbStudent.linkedin_id || "NA",
    dob: dbStudent.dob || "NA",
    address: dbStudent.address || "NA",
    feedback: dbStudent.feedback || "NA",
    Status: dbStudent.status || "Pending",
    status: dbStudent.status || "Pending",
    skills: [],
    Timestamp: dbStudent.timestamp || "NA",
    currentjob: dbStudent.present_occupation || "NA"
  };
};

export const fetchStudentsData = async (showAll: boolean = false): Promise<Student[]> => {
  try {
    const response = await fetch(`${API_URL}/students/index.php?showAll=${showAll}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.success && data.data) {
      return data.data.map(mapDbStudentToFrontend);
    }
    return [];
  } catch (error) {
    console.error("Error fetching students data:", error);
    return [];
  }
};

export const fetchStudentStrengthData = async (): Promise<StudentStrength[]> => {
  try {
    const response = await fetch(`${API_URL}/studentdb/index.php`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching student strength data:", error);
    return [];
  }
};

export const fetchAlumniTalks = async (): Promise<AlumniTalkItem[]> => {
  try {
    const response = await fetch(`${API_URL}/alumni-talks/index.php`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.success && data.data) {
      const mappedData = data.data.map((item: any) => ({
        id: item.id,
        date: item.date_of_event || '',
        name: item.name_of_alumni || '',
        school: item.school || '',
        department: item.department || '',
        registrationNo: item.registration_no || '',
        bannerPhotoUrl: item.banner_photo_url || '',
        talkon: item.talk_on || '',
        galleryLink: item.gallery_link || ''
      }));
      
      // Filter out duplicates based on name and talk topic
      const uniqueTalks = mappedData.filter((talk: any, index: number, self: any[]) => 
        index === self.findIndex((t) => (
          t.name === talk.name && t.talkon === talk.talkon
        ))
      );
      
      // Sort by date descending, fallback to ID descending for invalid/empty dates
      uniqueTalks.sort((a: any, b: any) => {
        // Parse dates - handling DD/MM/YYYY or YYYY-MM-DD
        let dateA = new Date(a.date).getTime();
        let dateB = new Date(b.date).getTime();
        
        // If dates are valid and different, sort by date
        if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
          return dateB - dateA;
        }
        
        // Fallback: sort by ID descending (newest added first)
        return b.id - a.id;
      });
      
      return uniqueTalks;
    }
    return [];
  } catch (error) {
    console.error("Error fetching alumni talks:", error);
    return [];
  }
};

export const fetchAlumniSpotlight = async (showAll: boolean = false): Promise<AlumniSpotlightItem[]> => {
  try {
    const response = await fetch(`${API_URL}/alumni-spotlight/index.php?showAll=${showAll}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.success && data.data) {
      return data.data.map((item: any) => ({
        id: item.id,
        dateAdded: item.date_added || '',
        name: item.name_of_alumni || '',
        yearOfGraduation: String(item.year_of_graduation || ''),
        school: item.school || '',
        department: item.department || '',
        registrationNo: item.registration_no || '',
        currentPosition: item.current_position || '',
        company: item.company_organization || '',
        photoUrl: item.photo_url || '',
        achievement: item.achievement_story || '',
        galleryLink: item.gallery_link || '',
        status: item.status || 'Pending'
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching alumni spotlight:", error);
    return [];
  }
};

export const updateStudentData = async (student: Student, userRole: "student" | "admin" = "student"): Promise<{ status: string; message: string }> => {
  try {
    const updates: any = {};
    
    // Status
    if (student.Status !== undefined) updates.status = student.Status;
    else if (student.status !== undefined) updates.status = student.status;
    
    // Basic Info
    if (student.name !== undefined) updates.name = student.name;
    if (student.email !== undefined) updates.email = student.email;
    if (student.personalEmail !== undefined) updates.personal_email = student.personalEmail;
    if (student.phone !== undefined) updates.mobile_no = student.phone;
    if (student.dob !== undefined) updates.dob = student.dob;
    
    // Academic Info
    if (student.school !== undefined) updates.school = student.school;
    if (student.programme !== undefined) updates.programme = student.programme;
    if (student.graduationYear !== undefined) updates.year_of_graduation = student.graduationYear;
    
    // Professional Info
    if (student.currentPosition !== undefined) updates.current_position = student.currentPosition;
    if (typeof student.designation === 'string') updates.designation = student.designation;
    else if (typeof student.currentDesignation === 'string') updates.designation = student.currentDesignation;
    
    if (student.organisation !== undefined) updates.organisation = student.organisation;
    else if (student.currentCompany !== undefined) updates.organisation = student.currentCompany;
    
    if (student.placeOfWork !== undefined) updates.place_of_work = student.placeOfWork;
    
    if (student.currentJob !== undefined) updates.present_occupation = student.currentJob;
    else if (student.currentjob !== undefined) updates.present_occupation = student.currentjob;
    
    // Higher Studies
    if (student.universityName !== undefined) updates.university_name = student.universityName;
    if (student.areaOfStudy !== undefined) updates.area_of_study = student.areaOfStudy;
    
    // Other Info
    if (student.areaOfInterest !== undefined) updates.area_of_interest = student.areaOfInterest;
    if (student.location !== undefined) updates.location = student.location;
    if (student.address !== undefined) updates.address = student.address;
    if (student.linkedinId !== undefined) updates.linkedin_id = student.linkedinId;
    if (student.photoUrl !== undefined) updates.photo_url = student.photoUrl;
    if (student.feedback !== undefined) updates.feedback = student.feedback;
    
    const response = await fetch(`${API_URL}/students/update.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registrationNo: student.registrationNo,
        updates: updates
      })
    });
    
    const data = await response.json();
    return { status: data.success ? 'success' : 'error', message: data.message };
  } catch (error) {
    console.error("Update failed:", error);
    return { status: 'error', message: 'Failed to update student' };
  }
};

export const deleteStudentData = async (student: Student): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/students/delete.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationNo: student.registrationNo })
    });
    const data = await response.json();
    return { status: data.success ? 'success' : 'error', message: data.message };
  } catch (error) {
    return { status: 'error', message: 'Failed to delete student' };
  }
};

export const uploadImageToDrive = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'photo');
    
    const response = await fetch(`${API_URL}/upload/index.php`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    throw new Error(data.message);
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Map registration to new backend
export const registerStudent = async (studentData: Record<string, any>, setUploadingImage?: (uploading: boolean) => void) => {
  try {
    let photoUrl = "";
    if (studentData.photo && studentData.photo instanceof File) {
      if (setUploadingImage) setUploadingImage(true);
      photoUrl = await uploadImageToDrive(studentData.photo);
      if (setUploadingImage) setUploadingImage(false);
    }
    
    const payload = {
      registration_no: studentData.registrationNo,
      name: studentData.name,
      email: studentData.email,
      personal_email: studentData.personalEmail,
      mobile_no: studentData.mobile,
      dob: studentData.dob,
      school: studentData.school,
      programme: studentData.programme,
      year_of_graduation: studentData.graduationYear,
      current_position: studentData.currentPosition,
      designation: studentData.designation,
      organisation: studentData.organisation,
      place_of_work: studentData.placeOfWork,
      university_name: studentData.universityName,
      area_of_study: studentData.areaOfStudy,
      area_of_interest: studentData.areaOfInterest,
      location: studentData.location,
      address: studentData.address,
      linkedin_id: studentData.linkedin || studentData.linkedinId,
      photo_url: photoUrl || studentData.photoUrl,
      feedback: studentData.feedback
    };
    
    const response = await fetch(`${API_URL}/students/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    return { status: data.success ? 'success' : 'error', message: data.message };
  } catch (error) {
    return { status: 'error', message: (error as Error).message };
  }
};

export function getDirectImageUrl(url: unknown): string {
  if (typeof url !== 'string' || !url || url === "NA") return "";
  // Local uploads are served from Next.js public/ via junction link
  if (url.startsWith('/Uploads/')) {
    return url; // Next.js serves public/Uploads/ at /Uploads/
  }
  return url;
}

export function getDirectImageUrlSized(url: unknown, width: number, height: number, mode: 'c' | 'p' = 'c'): string {
  return getDirectImageUrl(url);
}

export const authenticateStudent = async (email: string, password: string): Promise<Student | null> => {
  // Not implemented in DB yet as student login uses different mechanism if any
  return null;
};

export const authenticateDepartmentUser = async (username: string, password: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/auth/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      return {
        success: true,
        user: {
          username: data.data.user.username,
          role: data.data.user.role,
          name: data.data.user.username,
          department: data.data.user.department || "General",
          email: data.data.user.email || ""
        }
      };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Login failed' };
  }
};

export const updateAlumniTalk = async (criteria: any, updates: any) => {
  try {
    const response = await fetch(`${API_URL}/alumni-talks/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', criteria, updates })
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: 'Failed' };
  }
};

export const updateAlumniSpotlight = async (criteria: any, updates: any) => {
  try {
    const response = await fetch(`${API_URL}/alumni-spotlight/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', criteria, updates })
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: 'Failed' };
  }
};

// Stubs for remaining exports to prevent build errors
export const createAlumniTalk = async (talk: any) => ({ status: 'success', message: '' });
export const deleteAlumniTalk = async (criteria: any) => ({ status: 'success', message: '' });
export const createAlumniSpotlight = async (s: any) => ({ status: 'success', message: '' });
export const deleteAlumniSpotlight = async (c: any) => ({ status: 'success', message: '' });
export const fetchAlumniMeets = async () => [];
export const createAlumniMeet = async (m: any) => ({ status: 'success', message: '' });
export const updateAlumniMeet = async (c: any, u: any) => ({ status: 'success', message: '' });
export const deleteAlumniMeet = async (c: any) => ({ status: 'success', message: '' });
export const uploadReportToDrive = async (f: any) => "";
export const extractGoogleDriveFileId = (u: any) => null;
export const generateGoogleDriveUrls = (id: any) => ({ download: '', view: '', thumbnail: '' });
export const parseGalleryImages = (l: any) => [];
export const testUploadFunctionality = async () => ({ status: 'success' });
export const simpleUploadTest = async () => ({ status: 'success' });
export const testRealFileUpload = async (f: File) => ({ status: 'success' });
export const testImageUploadEndpoint = async () => true;
export const trackUploadAttempt = async (r: any, a: any, s: any, u?: any) => {};
export const fetchYouTubeData = async (e: string, p: any) => ({});
export const testApiConnectivity = async () => true;
export const testUpdateFunctionality = async () => true;

// Academic Information
export interface AcademicInfo {
  id?: number;
  school: string;
  department: string;
  programme: string;
}

export const fetchAcademicInfo = async (): Promise<AcademicInfo[]> => {
  try {
    const response = await fetch(`${API_URL}/academic/index.php`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching academic info:", error);
    return [];
  }
};

export const addAcademicInfo = async (info: AcademicInfo) => {
  try {
    const response = await fetch(`${API_URL}/academic/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info)
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};

export const updateAcademicInfo = async (info: AcademicInfo) => {
  try {
    const response = await fetch(`${API_URL}/academic/index.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info)
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};

export const deleteAcademicInfo = async (id: number) => {
  try {
    const response = await fetch(`${API_URL}/academic/index.php?id=${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};
// ==========================================
// Student Strength API Methods
// ==========================================

export interface StudentStrength {
  id?: string;
  registration_no: string;
  name: string;
  batch?: string;
  school?: string;
  program?: string;
  branch?: string;
  passout_year?: string | number;
}

export const fetchStudentStrength = async (): Promise<StudentStrength[]> => {
  try {
    const response = await fetch(`${API_URL}/student_strength/`);
    if (!response.ok) throw new Error("Network response was not ok");
    const result = await response.json();
    return result.success === true ? result.data : [];
  } catch (error) {
    console.error("Error fetching student strength:", error);
    return [];
  }
};

export const addStudentStrength = async (data: StudentStrength): Promise<{ status: string; message: string; data?: any }> => {
  try {
    const response = await fetch(`${API_URL}/student_strength/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding student strength:", error);
    throw error;
  }
};

export const updateStudentStrength = async (data: StudentStrength): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/student_strength/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating student strength:", error);
    throw error;
  }
};

export const deleteStudentStrength = async (id: string): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/student_strength/?id=${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting student strength:", error);
    throw error;
  }
};

export const bulkUploadStudentStrength = async (data: StudentStrength[]): Promise<{ status: string; message: string; data?: any }> => {
  try {
    const response = await fetch(`${API_URL}/student_strength/?action=bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error bulk uploading student strength:", error);
    throw error;
  }
};
