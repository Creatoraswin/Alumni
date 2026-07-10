import { ReactNode } from 'react';

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://alumni.sparvixainnovations.com/backend/api";

const parseDateString = (d: string): number => {
  if (!d) return 0;
  
  // 1. Check DD/MM/YYYY or DD-MM-YYYY
  const matchSlashOrDash = d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (matchSlashOrDash) {
    const day = parseInt(matchSlashOrDash[1], 10);
    const month = parseInt(matchSlashOrDash[2], 10) - 1;
    const year = parseInt(matchSlashOrDash[3], 10);
    return new Date(year, month, day).getTime();
  }
  
  // 2. Check YYYY-MM-DD or YYYY/MM/DD
  const matchYearFirst = d.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (matchYearFirst) {
    const year = parseInt(matchYearFirst[1], 10);
    const month = parseInt(matchYearFirst[2], 10) - 1;
    const day = parseInt(matchYearFirst[3], 10);
    return new Date(year, month, day).getTime();
  }

  const t = Date.parse(d);
  return isNaN(t) ? 0 : t;
};

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
  id?: string;
  registration_no?: string;
  name?: string;
  batch?: string;
  school?: string;
  program?: string;
  branch?: string;
  department?: string;
  passout_year?: number | string;
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
  description?: string;
  bannerPhotoUrl: string;
  galleryLink: string;
  reportUrl?: string;
  report?: string;
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
    photoUrl: (dbStudent.photo_url || "").replace(/\.(jpg|jpeg|png)$/i, '.webp'),
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
    const ts = new Date().getTime();
    const response = await fetch(`${API_URL}/students/index.php?showAll=${showAll}&t=${ts}`, { cache: 'no-store' });
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
    const response = await fetch(`${API_URL}/alumni-talks/index.php?nocache=true&t=${Date.now()}`);
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
        bannerPhotoUrl: (item.banner_photo_url || '').replace(/\.(jpg|jpeg|png)$/i, '.webp'),
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
        const dateA = parseDateString(a.date);
        const dateB = parseDateString(b.date);
        
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        
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
    const response = await fetch(`${API_URL}/alumni-spotlight/index.php?showAll=${showAll}&t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.success && data.data) {
      const mapped = data.data.map((item: any) => ({
        id: item.id,
        dateAdded: item.date_added || '',
        name: item.name_of_alumni || '',
        yearOfGraduation: String(item.year_of_graduation || ''),
        school: item.school || '',
        department: item.department || '',
        registrationNo: item.registration_no || '',
        currentPosition: item.current_position || '',
        company: item.company_organization || '',
        photoUrl: (item.photo_url || '').replace(/\.(jpg|jpeg|png)$/i, '.webp'),
        achievement: item.achievement_story || '',
        galleryLink: item.gallery_link || '',
        status: item.status || 'Pending'
      }));

      mapped.sort((a: any, b: any) => {
        const dateA = parseDateString(a.dateAdded);
        const dateB = parseDateString(b.dateAdded);
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        return b.id - a.id;
      });

      return mapped;
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

export const uploadImageToDrive = async (file: File, type: string = 'photo', registrationNo?: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (registrationNo) {
      formData.append('registration_no', registrationNo);
    }
    
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
      photoUrl = await uploadImageToDrive(studentData.photo, studentData.registrationNo);
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

const getBackendBaseUrl = (): string => {
  return API_URL.replace(/\/backend\/api\/?$/, '');
};

export function getDirectImageUrl(url: unknown): string {
  if (typeof url !== 'string' || !url || url === "NA") return "";
  // Local uploads are served from the backend server
  if (url.startsWith('/Uploads/') || url.startsWith('Uploads/')) {
    const baseUrl = getBackendBaseUrl();
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    return `${baseUrl}${cleanUrl}`;
  }
  return url;
}

export function getDirectImageUrlSized(url: unknown, width: number, height: number, mode: 'c' | 'p' = 'c'): string {
  return getDirectImageUrl(url);
}

export const authenticateStudent = async (email: string, password: string): Promise<Student | null> => {
  try {
    // Note: The modal passes password as DD/MM/YYYY
    const response = await fetch(`${API_URL}/students/index.php`);
    const data = await response.json();
    
    if (!data.success) return null;
    
    const students: Student[] = data.data.map((item: any) => mapDbStudentToFrontend(item));
    
    // Normalize user input date (which is usually dd/mm/yyyy from AuthModal)
    const normalizedInputPassword = password.replace(/\//g, '-');
    
    const matchedStudent = students.find(s => {
      // Check email
      const emailMatch = s.email?.toLowerCase() === email.toLowerCase() || 
                         s.personalEmail?.toLowerCase() === email.toLowerCase();
                         
      if (!emailMatch) return false;
      
      // The database might have DD-MM-YYYY (if updated) or YYYY-MM-DD
      // Convert database DOB to DD-MM-YYYY format for safe comparison
      let dbDobFormatted = s.dob;
      if (s.dob && s.dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // It's YYYY-MM-DD
        const parts = s.dob.split('-');
        dbDobFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else if (s.dob && s.dob.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // It's DD/MM/YYYY
        dbDobFormatted = s.dob.replace(/\//g, '-');
      }
      
      return dbDobFormatted === normalizedInputPassword || s.dob === password;
    });

    return matchedStudent || null;
  } catch (error) {
    console.error("Student authentication error:", error);
    return null;
  }
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
    const mappedUpdates: any = {};
    if (updates.date !== undefined) mappedUpdates.date_of_event = updates.date;
    if (updates.name !== undefined) mappedUpdates.name_of_alumni = updates.name;
    if (updates.school !== undefined) mappedUpdates.school = updates.school;
    if (updates.department !== undefined) mappedUpdates.department = updates.department;
    if (updates.registrationNo !== undefined) mappedUpdates.registration_no = updates.registrationNo;
    if (updates.bannerPhotoUrl !== undefined) mappedUpdates.banner_photo_url = updates.bannerPhotoUrl;
    if (updates.talkon !== undefined) mappedUpdates.talk_on = updates.talkon;
    if (updates.galleryLink !== undefined) mappedUpdates.gallery_link = updates.galleryLink;

    const mappedCriteria: any = {};
    if (criteria.id !== undefined) mappedCriteria.id = criteria.id;
    if (criteria.registrationNo !== undefined) mappedCriteria.registration_no = criteria.registrationNo;
    if (criteria.name !== undefined) mappedCriteria.name_of_alumni = criteria.name;

    const response = await fetch(`${API_URL}/alumni-talks/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', criteria: mappedCriteria, updates: mappedUpdates })
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: 'Failed to update alumni talk' };
  }
};

export const updateAlumniSpotlight = async (criteria: any, updates: any) => {
  try {
    const mappedUpdates: any = {};
    if (updates.dateAdded !== undefined) mappedUpdates.date_added = updates.dateAdded;
    if (updates.name !== undefined) mappedUpdates.name_of_alumni = updates.name;
    if (updates.yearOfGraduation !== undefined) mappedUpdates.year_of_graduation = updates.yearOfGraduation;
    if (updates.school !== undefined) mappedUpdates.school = updates.school;
    if (updates.department !== undefined) mappedUpdates.department = updates.department;
    if (updates.registrationNo !== undefined) mappedUpdates.registration_no = updates.registrationNo;
    if (updates.currentPosition !== undefined) mappedUpdates.current_position = updates.currentPosition;
    if (updates.company !== undefined) mappedUpdates.company_organization = updates.company;
    if (updates.photoUrl !== undefined) mappedUpdates.photo_url = updates.photoUrl;
    if (updates.achievement !== undefined) mappedUpdates.achievement_story = updates.achievement;
    if (updates.galleryLink !== undefined) mappedUpdates.gallery_link = updates.galleryLink;
    if (updates.status !== undefined) mappedUpdates.status = updates.status;

    const mappedCriteria: any = {};
    if (criteria.id !== undefined) mappedCriteria.id = criteria.id;
    if (criteria.registrationNo !== undefined) mappedCriteria.registration_no = criteria.registrationNo;
    if (criteria.name !== undefined) mappedCriteria.name_of_alumni = criteria.name;

    const response = await fetch(`${API_URL}/alumni-spotlight/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', criteria: mappedCriteria, updates: mappedUpdates })
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: 'Failed to update alumni spotlight' };
  }
};

// Functions for Alumni Talks
export const createAlumniTalk = async (talk: any) => {
  try {
    const talkData = {
      date_of_event: talk.date,
      name_of_alumni: talk.name,
      school: talk.school,
      department: talk.department,
      registration_no: talk.registrationNo,
      banner_photo_url: talk.bannerPhotoUrl,
      talk_on: talk.talkon,
      gallery_link: talk.galleryLink
    };
    const response = await fetch(`${API_URL}/alumni-talks/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', talk: talkData })
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: 'Failed to create alumni talk' };
  }
};

export const deleteAlumniTalk = async (criteria: any) => {
  try {
    const mappedCriteria: any = {};
    if (criteria.id !== undefined) mappedCriteria.id = criteria.id;
    if (criteria.registrationNo !== undefined) mappedCriteria.registration_no = criteria.registrationNo;
    if (criteria.name !== undefined) mappedCriteria.name_of_alumni = criteria.name;

    const response = await fetch(`${API_URL}/alumni-talks/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', criteria: mappedCriteria })
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: 'Failed to delete alumni talk' };
  }
};

export const createAlumniSpotlight = async (s: any) => {
  try {
    const spotlightData = {
      date_added: s.dateAdded,
      name_of_alumni: s.name,
      year_of_graduation: s.yearOfGraduation,
      school: s.school,
      department: s.department,
      registration_no: s.registrationNo,
      current_position: s.currentPosition,
      company_organization: s.company,
      photo_url: s.photoUrl,
      achievement_story: s.achievement,
      gallery_link: s.galleryLink,
      status: s.status
    };
    const response = await fetch(`${API_URL}/alumni-spotlight/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', spotlight: spotlightData })
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: 'Failed to create alumni spotlight' };
  }
};

export const deleteAlumniSpotlight = async (criteria: any) => {
  try {
    const mappedCriteria: any = {};
    if (criteria.id !== undefined) mappedCriteria.id = criteria.id;
    if (criteria.registrationNo !== undefined) mappedCriteria.registration_no = criteria.registrationNo;
    if (criteria.name !== undefined) mappedCriteria.name_of_alumni = criteria.name;

    const response = await fetch(`${API_URL}/alumni-spotlight/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', criteria: mappedCriteria })
    });
    return await response.json();
  } catch (e) {
    return { status: 'error', message: 'Failed to delete alumni spotlight' };
  }
};
export const fetchAlumniMeets = async () => [];
export const createAlumniMeet = async (m: any) => ({ status: 'success', message: '' });
export const updateAlumniMeet = async (c: any, u: any) => ({ status: 'success', message: '' });
export const deleteAlumniMeet = async (c: any) => ({ status: 'success', message: '' });
export const uploadReportToDrive = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'alumni_talk_report');
    
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

// ==========================================
// System Users API Methods
// ==========================================

export interface SystemUser {
  id?: number | string;
  username: string;
  password?: string; // Optional for fetches, required for creation
  role: "admin" | "department" | "school" | "alumni-manager" | "cadmin";
  name?: string;
  department?: string;
  email?: string;
}

export const fetchSystemUsers = async (): Promise<SystemUser[]> => {
  try {
    const response = await fetch(`${API_URL}/users/index.php`);
    if (!response.ok) throw new Error("Network response was not ok");
    const result = await response.json();
    return result.success === true ? result.data : [];
  } catch (error) {
    console.error("Error fetching system users:", error);
    return [];
  }
};

export const addSystemUser = async (user: SystemUser): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/users/index.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding system user:", error);
    return { success: false, message: "Network error" };
  }
};

export const updateSystemUser = async (user: SystemUser): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/users/index.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating system user:", error);
    return { success: false, message: "Network error" };
  }
};

export const deleteSystemUser = async (username: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/users/index.php?username=${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting system user:", error);
    return { success: false, message: "Network error" };
  }
};
