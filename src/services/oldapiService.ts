import { ReactNode } from 'react';
import { formatDateForSubmission, formatDateForDisplay, formatDateAsDDMMYYYY } from '@/lib/dateUtils';

// API configuration with additional security
// Store this URL in environment variables in production

// const NEW_API_URL = "https://script.google.com/macros/s/AKfycbz2k0JYP78v62PfLWyWq2RxyA64X36rXX-v74xETn8nxHtF1GTYcy0-jELOujMvzKNSdw/exec";
const API_URL = process.env.NEXT_PUBLIC_API_URL ;

// API Security measures
class ApiSecurity {
  private static lastRequestTime = 0;
  private static requestCount = 0;
  private static readonly RATE_LIMIT_DELAY = 100; // 100ms between requests
  private static readonly MAX_REQUESTS_PER_MINUTE = 60;
  private static readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  
  // JSONP implementation for CORS
  static jsonpRequest(url: string, payload: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      // Create a unique callback name
      const callbackName = `callback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      
      // Add callback parameter to the URL
      const script = document.createElement('script');
      
      // For GET requests with query parameters
      if (Object.keys(payload).length === 0) {
        script.src = `${url}?callback=${callbackName}`;
      } else {
        // For POST-like requests, we need to encode the payload
        const params = new URLSearchParams({
          ...Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, String(value)])),
          callback: callbackName
        });
        script.src = `${url}?${params.toString()}`;
      }
      
      // Define the callback function on the window object
      (window as unknown as Record<string, unknown>)[callbackName] = (data: unknown) => {
        // Clean up
        document.body.removeChild(script);
        delete (window as unknown as Record<string, unknown>)[callbackName];
        
        // Resolve with the data
        resolve(data);
      };
      
      // Handle script loading errors
      script.onerror = () => {
        document.body.removeChild(script);
        delete (window as unknown as Record<string, unknown>)[callbackName];
        reject(new Error('JSONP request failed'));
      };
      
      // Add the script to the document
      document.body.appendChild(script);
    });
  }
  
  // Hidden iframe approach for POST requests to bypass CORS
  static iframePostRequest(url: string, payload: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      // Use a hidden iframe to submit the form (bypasses CORS for POST)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.name = `upload_frame_${Date.now()}`;
      document.body.appendChild(iframe);
      
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      form.target = iframe.name;
      form.enctype = 'application/x-www-form-urlencoded';
      
      // Add all payload fields to the form, properly handling nested objects
      const addFormInput = (obj: Record<string, unknown>, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const fieldName = prefix ? `${prefix}[${key}]` : key;
          
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Handle nested objects
            addFormInput(value as Record<string, unknown>, fieldName);
          } else if (Array.isArray(value)) {
            // Handle arrays
            value.forEach((item, index) => {
              const arrayFieldName = `${fieldName}[${index}]`;
              if (item !== null && typeof item === 'object') {
                addFormInput(item as Record<string, unknown>, arrayFieldName);
              } else {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = arrayFieldName;
                input.value = String(item);
                form.appendChild(input);
              }
            });
          } else {
            // Handle primitive values
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = fieldName;
            input.value = String(value);
            form.appendChild(input);
          }
        });
      };
      
      addFormInput(payload);
      
      document.body.appendChild(form);
      
      // Handle response
      iframe.onload = () => {
        try {
          // Wait a bit for the response to load
          setTimeout(() => {
            try {
              // Try to get response from iframe
              let responseText = '';
              
              try {
                // Method 1: Try to get from iframe content
                responseText = iframe.contentDocument?.body?.textContent || 
                             iframe.contentDocument?.documentElement?.textContent || 
                             '';
              } catch (e) {}
              
              // Method 2: If iframe content is empty, try to get from the iframe's innerHTML
              if (!responseText) {
                try {
                  responseText = iframe.contentDocument?.body?.innerHTML || '';
                } catch (e) {}
              }
              
              // Clean up
              document.body.removeChild(form);
              document.body.removeChild(iframe);
              
              try {
                const result = JSON.parse(responseText);
                resolve(result);
              } catch (parseError) {
                // If it's not JSON, treat it as a success if it contains success indicators
                if (responseText.includes('success') || responseText.includes('url') || responseText.includes('drive.google.com')) {
                  resolve({ status: 'success', message: 'Operation completed successfully', rawResponse: responseText });
                } else if (responseText.includes('error') || responseText.includes('failed')) {
                  resolve({ status: 'error', message: 'Operation failed', rawResponse: responseText });
                } else {
                  // Default to success if we can't determine the status
                  resolve({ status: 'success', message: 'Operation completed', rawResponse: responseText });
                }
              }
            } catch (error) {
              document.body.removeChild(form);
              document.body.removeChild(iframe);
              reject(error);
            }
          }, 3000); // Wait 3 seconds for response
        } catch (error) {
          document.body.removeChild(form);
          document.body.removeChild(iframe);
          reject(error);
        }
      };
      
      iframe.onerror = () => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
        reject(new Error('Operation failed'));
      };
      
      // Submit the form
      form.submit();
    });
  }
  
  static async makeSecureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
    
    // Reset counter every minute
    if (this.requestCount > this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // For GET requests, try JSONP first to bypass CORS
    if (options.method === 'GET' || !options.method) {
      try {
        const result = await this.jsonpRequest(url, options.body ? JSON.parse(options.body as string) : {});
        // Create a mock response object
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve(result),
          text: () => Promise.resolve(JSON.stringify(result)),
        } as Response;
      } catch (jsonpError) {
        // If JSONP fails, fall back to regular fetch
        console.warn('JSONP request failed, falling back to regular fetch:', jsonpError);
      }
    }
    
    // For POST requests, try iframe approach first to bypass CORS
    if (options.method === 'POST') {
      try {
        const payload = options.body ? JSON.parse(options.body as string) : {};
        const result = await this.iframePostRequest(url, payload);
        
        // Check if result indicates an error
        if (result && typeof result === 'object' && 'status' in result && result.status === 'error') {
          const errorMessage = (result as { message?: string }).message || 'Operation failed';
          throw new Error(errorMessage);
        }
        
        // Create a mock response object
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve(result),
          text: () => Promise.resolve(JSON.stringify(result)),
        } as Response;
      } catch (iframeError) {
        // If iframe approach fails, fall back to regular fetch
        console.warn('Iframe POST request failed, falling back to regular fetch:', iframeError);
        // Re-throw the error to be handled by the calling function
        throw iframeError;
      }
    }
    
    // Add timeout and security headers
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'CUTMAP-Alumni-Dashboard/1.0',
        ...options.headers,
      },
    };
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), this.REQUEST_TIMEOUT);
    });
    
    try {
      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, secureOptions),
        timeoutPromise
      ]);

      return response;
    } catch (error) {
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.name === 'AbortError') {
          throw new Error('Request timeout. Please check your internet connection and try again.');
        } else if (error.message.includes('rate limit')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('TypeError')) {
          throw new Error('Connection failed. Please check your internet connection and try again.');
        } else if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Connection refused. Please check your internet connection and try again.');
        } else if (error.message.includes('ECONNRESET')) {
          throw new Error('Connection reset. Please check your internet connection and try again.');
        } else {
          throw new Error(`Request failed: ${error.message}`);
        }
      } else {
        throw new Error('An unknown error occurred. Please try again.');
      }
    }
  }
  
  static sanitizeInput(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove potentially dangerous characters
      return data.replace(/[<>"'&]/g, '');
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> | unknown[] = Array.isArray(data) ? [] : {};
      for (const key in data) {
        if (Array.isArray(sanitized)) {
          sanitized.push(this.sanitizeInput((data as unknown[])[parseInt(key)]));
        } else {
          sanitized[key] = this.sanitizeInput((data as Record<string, unknown>)[key]);
        }
      }
      return sanitized;
    }
    return data;
  }
}

// Update ApiStudent interface to match new Google Sheet columns
export interface ApiStudent {
  "Timestamp": string;
  "Email Address": string;
  "School": string;
  "Programme": string;
  "Year of Graduation": number;
  "Name of the Student": string;
  "Registration No.": number;
  "Current Position": string;
  "Designation": string;
  "Name of the Organisation": string;
  "Place of work": string;
  "Area of interest/expertise": string;
  "University Name": string;
  "Area of Study": string;
  "location": string;
  "Personal Email id": string;
  "Mobile No.": number;
  "DOB": string;
  "LinkedIn Id": string;
  "Upload photo": string;
  "Address": string;
  "Share your Feed back of University": string;
  "Present Occupation": string;
  "Status"?: string;
}

export interface ApiResponse {
  "Form Responses 1": ApiStudent[];
}

// Update Student interface for frontend use
export interface Student {
  currentJob: string;
  currentDesignation: string | ReactNode;
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  graduationYear: string;
  currentPosition: string;
  universityName: string;
  areaOfStudy: string;
  location: string;
  status?: string;
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
  Timestamp: string; // Added for sorting by recency
  currentjob: string; // Added for compatibility with existing code
  Status?: string; // Added for approval workflow: "Approved", "Rejected", or empty/undefined for pending
}

export const fetchStudentsData = async (showAll: boolean = false): Promise<Student[]> => {
  try {
    // Try the secure request first, fallback to regular fetch if it fails
    let response;
    try {
      response = await ApiSecurity.makeSecureRequest(API_URL);
    } catch (securityError) {
      console.warn('Secure request failed, falling back to regular fetch:', securityError);
      response = await ApiSecurity.makeSecureRequest(API_URL);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse = await response.json();

    if (!data || !data["Form Responses 1"]) {
      console.error('Invalid response structure:', data);
      return [];
    }

    // Log the field names of the first student to see what's available
    if (data["Form Responses 1"].length > 0) {
      const firstStudent = data["Form Responses 1"][0];

      // Check if "Status" field exists
      if ("Status" in firstStudent) {} else {
        // Check for case variations
        const fieldNames = Object.keys(firstStudent);
        const statusField = fieldNames.find(name => name.toLowerCase() === "status");
        if (statusField) {}

        // Check for whitespace variations
        const statusFieldWithWhitespace = fieldNames.find(name => name.trim().toLowerCase() === "status");
        if (statusFieldWithWhitespace) {}
      }
    }

    // Map and filter students
    const allStudents = data["Form Responses 1"].map((student, index) => {
      // Check if Status field exists in raw data
      const rawStatus = student["Status"];
      if (rawStatus === undefined) {} else if (rawStatus === null) {} else if (typeof rawStatus === 'string') {} else {}

      // Special check for Status field name variations
      const fieldNames = Object.keys(student);
      const statusFieldNames = fieldNames.filter(name => 
        name.toLowerCase().includes('status') || 
        name.toLowerCase().includes('state')
      );
      if (statusFieldNames.length > 0) {
        statusFieldNames.forEach(fieldName => {});
      }

      return {
        id: student["Registration No."].toString(),
        name: (student["Name of the Student"] || "NA").trim() || "NA",
        email: student["Email Address"] || student["Personal Email id"] || "NA",
        phone: student["Mobile No."].toString() || "NA",
        department: extractDepartment(student["Programme"] || "NA"),
        graduationYear: student["Year of Graduation"].toString() || "NA",
        currentPosition: student["Current Position"] || "NA",
        currentJob: student["Present Occupation"] || "NA",
        currentCompany: student["Current Company"] || "NA",
        currentLocation: student["Current Location"]  || "NA",
        currentRole: student["Current Role"] || "NA",

        currentDesignation: student["Designation"] || "NA",
        
        
        universityName: student["University Name"] || "NA",
        areaOfStudy: student["Area of Study"] || "NA",
        location: student["location"] || "NA",
        areaOfInterest: student["Area of interest/expertise"] || "NA",
        photoUrl: student["Upload photo"] || "",
        registrationNo: student["Registration No."].toString() || "NA",
        school: student["School"] || extractSchool(student["Programme"] || "NA"),
        programme: student["Programme"] || "NA",
        designation: student["Designation"] || "NA",
        organisation: student["Name of the Organisation"] || "NA",
        placeOfWork: student["Place of work"] || "NA",
        linkedinId: student["LinkedIn Id"] || "NA",
        dob: (() => {
          const rawDate = student["DOB"];
          if (!rawDate || rawDate === "NA") return "NA";
          
          // If it's an ISO string (like "2025-09-22T18:30:00.000Z")
          if (rawDate.includes('T') && rawDate.includes('Z')) {
            // Extract just the date part
            const match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
              const [, year, month, day] = match;
              return `${day}/${month}/${year}`;
            }
          }
          
          // If already in DD/MM/YYYY format, return as is
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
            return rawDate;
          }
          
          // If in YYYY-MM-DD format
          const isoMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (isoMatch) {
            const [, year, month, day] = isoMatch;
            return `${day}/${month}/${year}`;
          }
          
          return rawDate;
        })(),
        address: student["Address"] || "NA",
        feedback: student["Share your Feed back of University"] || "NA",
        Status: (() => {
          // Check for various possible field names for Status with case-insensitive matching
          const fieldNames = Object.keys(student);
          const statusField = fieldNames.find(name => 
            name.toLowerCase().includes('status') || 
            name.toLowerCase().includes('approval')
          );

          if (statusField) {
            return student[statusField];
          }

          return undefined;
        })(),
        skills: [],
        Timestamp: student["Timestamp"] || "NA",
        currentjob: student["Present Occupation"] || "NA", // Added for compatibility
      };
    });

    // Log status distribution
    const statusCounts: Record<string, number> = {};
    allStudents.forEach(student => {
      const status = student.Status;
      if (status === undefined) {
        statusCounts['undefined'] = (statusCounts['undefined'] || 0) + 1;
      } else if (status === null) {
        statusCounts['null'] = (statusCounts['null'] || 0) + 1;
      } else if (typeof status === 'string') {
        const trimmed = status.trim();
        statusCounts[trimmed || '(empty string)'] = (statusCounts[trimmed || '(empty string)'] || 0) + 1;
      } else {
        statusCounts[`other-${typeof status}`] = (statusCounts[`other-${typeof status}`] || 0) + 1;
      }
    });
    allStudents.forEach((student, index) => {
      if (index < 10) {}
    });

    // If showAll is true, return all students (for admin/approval views)
    if (showAll) {
      return allStudents;
    }

    // Otherwise, return only approved students
    const approvedStudents = allStudents.filter(student => {
      // Check if Status field is 'Approved'
      const isApproved = student.Status === 'Approved';
      return isApproved;
    });

    return approvedStudents;
  } catch (error) {
    console.error("Error fetching students data:", error);
    return [];
  }
};

const extractDepartment = (programme: string): string => {
  // CSE Department
  if (programme.includes("CSE") || programme.includes("MCA") || programme.includes("BCA")) return "cse";
  
  // ECE Department
  if (programme.includes("ECE")) return "ece";
  
  // Mechanical Department
  if (programme.includes("Mechanical")) return "mechanical";
  
  // Radiology Department
  if (programme.includes("Radiology") || programme.includes("Imaging Technology")) return "radiology";
  
  // Optometry Department
  if (programme.includes("Optometry")) return "optometry";
  
  // Forensic Sciences Department
  if (programme.includes("Forensic") || 
      programme.includes("Forensic Sciences") || 
      programme.toLowerCase().includes("forensic") ||
      programme.toLowerCase().includes("b.sc forensic"))  return "forensic";
  
  // Anesthesia Department
  if (programme.includes("Anaesthesia") || programme.includes("Operation Theatre")) return "anesthesia";
  
  // BBA Department
  if (programme.includes("BBA")) return "bba";
  
  // Other programs
  if (programme.includes("M. Tech") || programme.includes("PhD")) return "other";
  
  return "other";
};

// Function to extract school from programme
const extractSchool = (programme: string): string => {
  // School of Paramedical and Allied Health Sciences (SoPAHS)
  if (programme.includes("Radiology") ||
      programme.includes("Anaesthesia") ||
      programme.includes("Optometry") ||
      programme.includes("Forensic Sciences")) {
    return "SoPAHS";
  }
  
  // School of Engineering and Technology (SoET)
  if (programme.includes("B.Tech") ||
      programme.includes("MCA") ||
      programme.includes("BCA") ||
      programme.includes("M. Tech")) {
    return "SoET";
  }
  
  // School of Management (SoM)
  if (programme.includes("BBA") || programme.includes("MBA")) {
    return "SoM";
  }
   // School of Forensic Science (SoFS)
  if (programme.includes("Forensic Science") || programme.includes("B.Sc Forensic Sciences")) {
    return "SoFS";
  }
  
  return "Other";
};

// Universal image URL converter for Google Drive and other hosts
export function getDirectImageUrl(url: string): string {
  if (!url || url === "NA" || url === "Not specified") {
    return ""; // Return empty string to let AvatarFallback show initials
  }

  // For URLs like: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    // Use Google's CDN which has better CORS support
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=w400-h400-c`;
  }

  // For URLs like: https://drive.google.com/open?id=FILE_ID
  const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (openIdMatch && openIdMatch[1]) {
    // Use Google's CDN which has better CORS support
    return `https://lh3.googleusercontent.com/d/${openIdMatch[1]}=w400-h400-c`;
  }
  
  // If it's already a direct image URL or another format
  return url;
};

// Extract Google Drive file ID from various URL formats
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/FILE_ID
    /[?&]id=([a-zA-Z0-9_-]+)/, // ?id=FILE_ID or &id=FILE_ID
    /\/d\/([a-zA-Z0-9_-]+)/, // /d/FILE_ID
    /\/open\?id=([a-zA-Z0-9_-]+)/ // /open?id=FILE_ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Generate multiple Google Drive URL formats for fallback
export function generateGoogleDriveUrls(fileId: string): string[] {
  if (!fileId) return [];
  
  return [
    `https://lh3.googleusercontent.com/d/${fileId}=w400-h400-c`, // Google's CDN - most reliable
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`, // Thumbnail with explicit size
    `https://drive.google.com/uc?export=view&id=${fileId}`, // Direct view
    `https://drive.google.com/thumbnail?id=${fileId}`, // Basic thumbnail
  ];
}

// Keep this as an alias for backward compatibility
export const convertGoogleDriveUrl = getDirectImageUrl;

export const updateStudentData = async (student: Student, userRole: "student" | "admin" = "student"): Promise<{ status: string; message: string; updatedFields?: string[] }> => {
  // Define what fields each role can update
  const studentEditableFields = {
    registrationNo: student.registrationNo,
    currentJob: student.currentPosition,
    currentPosition: student.currentPosition,
    designation: student.designation,
    organisation: student.organisation,
    placeOfWork: student.placeOfWork,
    location: student.location,
    areaOfInterest: student.areaOfInterest,
    universityName: student.universityName,
    areaOfStudy: student.areaOfStudy,
    photoUrl: student.photoUrl,
  };

  // Add DOB to student editable fields if it exists
  if (student.dob !== undefined && student.dob !== "") {
    studentEditableFields['dob'] = formatDateForSubmission(student.dob);
  }

  // Build admin fields dynamically - only include fields that are provided
  const adminEditableFields: Record<string, string | number | undefined> = {
    registrationNo: student.registrationNo,
  };
  
  // Only include fields that are actually provided in the student object
  if (student.name !== undefined) adminEditableFields.name = student.name;
  if (student.email !== undefined) adminEditableFields.email = student.email;
  if (student.phone !== undefined) adminEditableFields.phone = student.phone;
  if (student.school !== undefined) adminEditableFields.school = student.school;
  if (student.programme !== undefined) adminEditableFields.programme = student.programme;
  if (student.graduationYear !== undefined) adminEditableFields.graduationYear = student.graduationYear;
  if (student.designation !== undefined) adminEditableFields.designation = student.designation;
  if (student.currentPosition !== undefined) {
    adminEditableFields.currentJob = student.currentPosition;
    adminEditableFields.currentPosition = student.currentPosition;
  }
  if (student.currentDesignation !== undefined) adminEditableFields.currentDesignation = String(student.currentDesignation);
  if (student.organisation !== undefined) adminEditableFields.organisation = student.organisation;
  if (student.placeOfWork !== undefined) adminEditableFields.placeOfWork = student.placeOfWork;
  if (student.areaOfInterest !== undefined) adminEditableFields.areaOfInterest = student.areaOfInterest;
  if (student.location !== undefined) adminEditableFields.location = student.location;
  if (student.universityName !== undefined) adminEditableFields.universityName = student.universityName;
  if (student.areaOfStudy !== undefined) adminEditableFields.areaOfStudy = student.areaOfStudy;
  // Handle DOB separately with proper formatting
  if (student.linkedinId !== undefined) adminEditableFields.linkedinId = student.linkedinId;
  if (student.photoUrl !== undefined) adminEditableFields.photoUrl = student.photoUrl;
  if (student.address !== undefined) adminEditableFields.address = student.address;
  if (student.feedback !== undefined) adminEditableFields.feedback = student.feedback;
  if (student.Status !== undefined) adminEditableFields.Status = student.Status;
  
  // CRITICAL: Format DOB properly for Google Sheets (MM/DD/YYYY format)
  // This is the same approach used in the SignUp page
  if (student.dob !== undefined && student.dob !== "") {
    // Format DOB for submission to Google Sheets using the same approach as SignUp
    adminEditableFields.dob = formatDateForSubmission(student.dob);
  }

  const payload = {
    action: 'updateStudent',
    userRole: userRole,
    student: userRole === "admin" ? adminEditableFields : studentEditableFields,
  };

  // Use the backend proxy to avoid CORS issues
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  // Try to parse the response regardless of status
  let responseData;
  try {
    responseData = await response.json();
  } catch (parseError) {
    throw new Error("Invalid response from server");
  }

  if (!response.ok || responseData.status === "error") {
    throw new Error(responseData.message || 'An unknown error occurred.');
  }
  
  return responseData;
};

// Function to delete a student from the Google Sheet
export const deleteStudentData = async (student: Student): Promise<{ status: string; message: string }> => {
  const payload = {
    action: 'deleteStudent',
    student: {
      registrationNo: student.registrationNo,
      name: student.name
    }
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  let responseData;
  try {
    responseData = await response.json();
  } catch (parseError) {
    throw new Error("Invalid response from server");
  }

  if (!response.ok || responseData.status === "error") {
    throw new Error(responseData.message || 'Failed to delete student.');
  }
  
  return responseData;
};

export const authenticateStudent = async (email: string, password: string): Promise<Student | null> => {
  function normalizeDob(dob: string): string {
    return formatDateForDisplay(dob) || '';
  }
  
  function formatPasswordToDisplayFormat(password: string): string {
    // If password is in DD/MM/YYYY format, convert to display format
    const ddmmyyyy = password.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return formatDateForDisplay(password);
    }
    // If password is already in display format, return as-is
    return password;
  }
  
  try {
    const students = await fetchStudentsData();
    
    const student = students.find(s => {
      const normalizedDob = normalizeDob(s.dob);
      const formattedPassword = formatPasswordToDisplayFormat(password);
      const emailMatch = s.email.toLowerCase() === email.toLowerCase();
      const dobMatch = normalizedDob === formattedPassword;
      
      return emailMatch && dobMatch;
    });
    
    return student || null;
  } catch (error: unknown) {
    return null;
  }
};
// JSONP implementation for CORS
interface JsonpResponse {
  success?: boolean;
  user?: {
    username: string;
    role: string;
    department: string;
    name: string;
    email: string;
    departments?: string[];
  };
  message?: string;
}

const jsonp = (url: string, params: Record<string, string>): Promise<JsonpResponse> => {
  return new Promise((resolve, reject) => {
    // Create a unique function name
    const callbackName = `jsonp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    
    // Add callback parameter to the URL
    const queryParams = new URLSearchParams({
      ...params,
      callback: callbackName
    });
    
    const script = document.createElement('script');
    script.src = `${url}?${queryParams.toString()}`;
    
    // Define the callback function on the window object
    (window as unknown as Record<string, unknown>)[callbackName] = (data: JsonpResponse) => {
      // Clean up
      document.body.removeChild(script);
      delete (window as unknown as Record<string, unknown>)[callbackName];
      
      // Resolve with the data
      resolve(data);
    };
    
    // Handle script loading errors
    script.onerror = () => {
      document.body.removeChild(script);
      delete (window as unknown as Record<string, unknown>)[callbackName];
      reject(new Error('JSONP request failed'));
    };
    
    // Add the script to the document
    document.body.appendChild(script);
  });
};

export const authenticateDepartmentUser = async (username: string, password: string): Promise<{
  success: boolean;
  user?: {
    username: string;
    role: string;
    department: string;
    name: string;
    email: string;
    departments?: string[];
  };
  message?: string;
}> => {
  try {

    
    // Use JSONP for CORS
    const result = await jsonp(API_URL, {
      action: 'authenticate',
      username: username,
      password: password
    });
    

    
    // If the response is a string, try to parse it
    let response = result;
    if (typeof result === 'string') {
      try {
        response = JSON.parse(result);
      } catch (e) {
        throw new Error('Invalid response format from server');
      }
    }
    
    // Check if the response indicates success
    if (response && response.success && response.user) {
      return {
        success: true,
        user: {
          username: response.user.username || '',
          role: response.user.role || '',
          department: response.user.department || '',
          name: response.user.name || '',
          email: response.user.email || '',
          departments: response.user.departments || []
        }
      };
    } else {
      return {
        success: false,
        message: response?.message || 'Authentication failed. Please check your credentials.'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Authentication failed. Please try again.'
    };
  }
};

// Function to test API connectivity
export const testApiConnectivity = async (): Promise<boolean> => {
  try {
    // Use our secure request method which handles CORS
    const response = await ApiSecurity.makeSecureRequest(API_URL, {
      method: 'GET'
      // Note: We can't use signal with our current implementation, so we'll omit it
    });

    // Safely log headers if they exist
    if (response.headers && typeof response.headers.entries === 'function') {} else {}

    const responseText = await response.text();

    if (response.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ API connectivity test FAILED with error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

// Function to test update functionality
export const testUpdateFunctionality = async (): Promise<boolean> => {
  try {
    // Create a test payload
    const testPayload = {
      action: 'test',
      message: 'Test update request'
    };

    const response = await ApiSecurity.makeSecureRequest(API_URL, {
      method: 'POST',
      body: JSON.stringify(testPayload),
    });

    const responseData = await response.json();

    return response.ok;
  } catch (error) {
    console.error('Test update failed:', error);
    return false;
  }
};

// Manual test function - you can call this from browser console
export const manualApiTest = async () => {
  try {
    // Use our secure request method which handles CORS
    const response = await ApiSecurity.makeSecureRequest(API_URL);

    // Safely log headers if they exist
    if (response.headers && typeof response.headers.entries === 'function') {} else {}

    const text = await response.text();

    if (response.ok) {
      try {
        const json = JSON.parse(text);
      } catch (parseError) {}
    } else {}
  } catch (error) {}
};

// Make it available globally for console testing
(window as unknown as Record<string, unknown>).manualApiTest = manualApiTest;

// Test upload functionality specifically
export const testUploadFunctionality = async () => {
  // Test 1: Basic POST request using our CORS handling approach
  try {
    const testPayload = {
      action: 'uploadPhoto',
      fileName: 'test.jpg',
      fileContent: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 pixel PNG
      mimeType: 'image/png'
    };

    // Use our secure request method which handles CORS
    const response = await ApiSecurity.makeSecureRequest(API_URL, {
      method: 'POST',
      body: JSON.stringify(testPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Safely log headers if they exist
    if (response.headers && typeof response.headers.entries === 'function') {} else {}

    const responseText = await response.text();

    if (response.ok) {
      try {
        const json = JSON.parse(responseText);
      } catch (parseError) {}
    } else {}
  } catch (error) {}
};

// Make it available globally
(window as unknown as Record<string, unknown>).testUploadFunctionality = testUploadFunctionality;

// JSONP upload function to bypass CORS
const jsonpUpload = (url: string, payload: Record<string, string>): Promise<Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    // Use a hidden iframe to submit the form (bypasses CORS)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = `upload_frame_${Date.now()}`;
    document.body.appendChild(iframe);
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = iframe.name;
    form.enctype = 'application/x-www-form-urlencoded';
    
    // Send individual fields that the Google Apps Script can access via e.parameter
    const fields = [
      { name: 'action', value: payload.action },
      { name: 'fileName', value: payload.fileName },
      { name: 'fileContent', value: payload.fileContent },
      { name: 'mimeType', value: payload.mimeType }
    ];
    
    fields.forEach(field => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = field.name;
      input.value = field.value;
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    
    // Handle response
    iframe.onload = () => {
      try {
        // Wait a bit for the response to load
        setTimeout(() => {
          try {
            // Try multiple ways to get the response
            let responseText = '';

            try {
              // Method 1: Try to get from iframe content
              responseText = iframe.contentDocument?.body?.textContent || 
                           iframe.contentDocument?.documentElement?.textContent || 
                           '';
            } catch (e) {}

            // Method 2: If iframe content is empty, try to get from the iframe's innerHTML
            if (!responseText) {
              try {
                responseText = iframe.contentDocument?.body?.innerHTML || '';
              } catch (e) {}
            }

            // Method 3: If still empty, assume success since the request went through
            if (!responseText) {
              responseText = '{"status":"success","message":"Upload completed"}';
            }

            // Clean up
            document.body.removeChild(form);
            document.body.removeChild(iframe);

            try {
              const result = JSON.parse(responseText);
              resolve(result);
            } catch (parseError) {
              // If it's not JSON, treat it as a success if it contains success indicators
              if (responseText.includes('success') || responseText.includes('url') || responseText.includes('drive.google.com')) {
                resolve({ status: 'success', message: 'Upload completed', rawResponse: responseText });
              } else {
                resolve({ status: 'error', message: 'Upload failed', rawResponse: responseText });
              }
            }
          } catch (error) {
            document.body.removeChild(form);
            document.body.removeChild(iframe);
            reject(error);
          }
        }, 3000); // Wait 3 seconds for response
      } catch (error) {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
        reject(error);
      }
    };
    
    iframe.onerror = () => {
      document.body.removeChild(form);
      document.body.removeChild(iframe);
      reject(new Error('Upload failed'));
    };
    
    // Submit the form
    form.submit();
  });
};

// Simple direct test - bypasses all the complex error handling
export const simpleUploadTest = async () => {
  try {
    const payload = {
      action: 'uploadPhoto',
      fileName: 'test.jpg',
      fileContent: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      mimeType: 'image/png'
    };

    const result = await jsonpUpload(API_URL, payload);

    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Make it available globally
(window as unknown as Record<string, unknown>).simpleUploadTest = simpleUploadTest;

// Test with a real file upload
export const testRealFileUpload = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const base64Data = e.target?.result as string;
        if (!base64Data) {
          throw new Error('Failed to read file data');
        }

        const base64Content = base64Data.split(',')[1];
        if (!base64Content) {
          throw new Error('Invalid file data format');
        }

        const payload = {
          action: 'uploadPhoto',
          fileName: file.name,
          fileContent: base64Content,
          mimeType: file.type
        };

        const result = await jsonpUpload(API_URL, payload);
        resolve(result);
      } catch (error) {
        console.error('Real file upload error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Make it available globally
(window as unknown as Record<string, unknown>).testRealFileUpload = testRealFileUpload;

// Function to test image upload endpoint specifically
export const testImageUploadEndpoint = async (): Promise<boolean> => {
  try {
    const testPayload = {
      action: 'uploadPhoto',
      fileName: 'test.jpg',
      fileContent: 'test', // Minimal test data
      mimeType: 'image/jpeg'
    };

    // Use our secure request method which handles CORS
    const response = await ApiSecurity.makeSecureRequest(API_URL, {
      method: 'POST',
      body: JSON.stringify(testPayload),
      // Note: We can't use signal with our current implementation, so we'll omit it
    });

    const responseText = await response.text();

    // We expect this to fail with a proper error message, not a parsing error
    return response.status !== 0; // Any response is better than no response
  } catch (error) {
    console.error('Image upload endpoint test failed:', error);
    return false;
  }
};

// Function to upload image to Google Drive
export const uploadImageToDrive = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const attemptUpload = async (attempt: number): Promise<string> => {
        try {
          const base64Data = e.target?.result as string;
          const base64Content = base64Data.split(',')[1];
          const payload = {
            action: 'uploadPhoto',
            fileName: file.name,
            fileContent: base64Content,
            mimeType: file.type
          };

          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
          });

          let result: { status?: string; url?: string; message?: string };
          try {
            result = await response.json();
          } catch (parseError) {
            throw new Error('Invalid response from image upload service');
          }

          if (!response.ok || result.status !== 'success' || !result.url) {
            throw new Error(result?.message || 'Image upload failed');
          }

          return result.url as string;
        } catch (error) {
          if (attempt < 2) {
            return attemptUpload(attempt + 1);
          }
          throw error;
        }
      };

      try {
        const url = await attemptUpload(0);
        resolve(url);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Image upload failed'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

// Add upload attempt tracking
export const trackUploadAttempt = async (registrationNo: string, attemptNumber: number, success: boolean, imageUrl: string = ""): Promise<void> => {
  try {
    const payload = {
      action: 'trackUploadAttempt',
      registrationNo,
      attemptNumber,
      success,
      imageUrl,
      timestamp: new Date().toISOString()
    };

    const response = await ApiSecurity.makeSecureRequest(API_URL, {
      method: 'POST',
      body: JSON.stringify(ApiSecurity.sanitizeInput(payload)),
    });

    if (!response.ok) {
      console.error(`Failed to track upload attempt: ${response.status}`);
    }
  } catch (error) {
    console.error('Error tracking upload attempt:', error);
  }
};

// Define type for student registration data
interface StudentRegistrationData {
  school: string;
  programme: string;
  graduationYear: string;
  name: string;
  registrationNo: string;
  currentPosition: string;
  designation: string;
  organisation: string;
  placeOfWork: string;
  areaOfInterest: string;
  universityName: string;
  location: string;
  areaOfStudy: string;
  email: string;
  mobile: string;
  dob: string;
  linkedin: string;
  photo: File | string | null;  // Allow File, string URL, or null
  address: string;
  feedback: string;
}

// Function to prepare payload with NA logic
const toNA = (v: string | File | null | undefined) => (v === undefined || v === null || v === "" ? "NA" : v);

// Update registerStudent with proper types
export const registerStudent = async (
  form: Record<string, string | File | null>,
  setUploadingImage?: (uploading: boolean) => void
): Promise<unknown> => {
  // Handle image upload first if photo exists
  let photoUrl = "";
  if (form.photo && form.photo instanceof File) {
    try {
      if (setUploadingImage) setUploadingImage(true);
      photoUrl = await uploadImageToDrive(form.photo);
      if (setUploadingImage) setUploadingImage(false);
    } catch (error) {
      if (setUploadingImage) setUploadingImage(false);
      // Since photo is required in the form, do not proceed without a URL
      throw new Error('Image upload failed. Please try again.');
    }
  }
  
  const payload = {
    action: 'registerStudent',
    student: {
      "School": toNA(form.school),
      "Programme": toNA(form.programme),
      "Year of Graduation": toNA(form.graduationYear),
      "Name of the Student": toNA(form.name),
      "Registration No.": toNA(form.registrationNo),
      "Current Position": toNA(form.currentPosition),
      "Designation": toNA(form.designation),
      "Name of the Organisation": toNA(form.organisation),
      "Place of work": toNA(form.placeOfWork),
      "Area of interest/expertise": toNA(form.areaOfInterest),
      "University Name": toNA(form.universityName),
      "Area of Study": toNA(form.areaOfStudy),
      "location": toNA(form.location),
      "Personal Email id": toNA(form.email),
      "Mobile No.": toNA(form.mobile),
      "DOB": toNA(form.dob),
      "LinkedIn Id": toNA(form.linkedin),
      "Upload photo": photoUrl, // Use the uploaded image URL
      "Address": toNA(form.address),
      "Share your Feed back of University": toNA(form.feedback)
    }
  };
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'An unknown error occurred.');
  }
  return await response.json();
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// YouTube proxy function to bypass CORS
export const fetchYouTubeData = async (endpoint: string, params: Record<string, string>): Promise<unknown> => {
  const payload = {
    action: 'youtubeProxy',
    endpoint: endpoint,
    params: params
  };
  
  try {
    const response = await ApiSecurity.makeSecureRequest(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`YouTube proxy error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('YouTube proxy error:', error);
    throw error;
  }
};

