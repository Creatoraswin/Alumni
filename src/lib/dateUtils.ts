/**
 * Centralized date utility functions for consistent date handling across the application
 * 
 * Format Standard: DD/MM/YYYY (13 September 2025)
 * 
 * Google Sheets expects and stores dates in MM/DD/YYYY format
 * App displays dates in DD/MM/YYYY (13 September 2025) format for user readability
 * Input fields use YYYY-MM-DD format (HTML date input standard)
 * 
 * Key conversion flow:
 * 1. User inputs: YYYY-MM-DD (HTML date input)
 * 2. For submission: Convert to MM/DD/YYYY (Google Sheets format)
 * 3. Google Sheets stores: MM/DD/YYYY internally
 * 4. API returns: ISO string like "2025-09-12T18:30:00.000Z"
 * 5. For display: Convert to DD/MM/YYYY (13 September 2025) format
 */

// Month names for formatting
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format a date string as DD/MM/YYYY
 * Handles various input formats including ISO strings
 * @param dateString - The date string to format
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDateAsDDMMYYYY(dateString: string): string {
  if (!dateString) return '';

  try {
    // Handle ISO date strings (e.g., "2004-06-11T18:30:00.000Z")
    if (dateString.includes('T') && dateString.includes('Z')) {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }

    // Handle already formatted DD/MM/YYYY strings
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }

    // Handle MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return `${parts[1]}/${parts[0]}/${parts[2]}`;
      }
    }

    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    // If none of the above patterns match, return as is
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format date for display (convert to DD/MM/YYYY format)
 * Handles various input formats: MM/DD/YYYY, YYYY-MM-DD, ISO strings
 */
export const formatDateForDisplay = (dateString: string | undefined | null): string => {
   if (!dateString || dateString === "NA" || dateString.trim() === "") {
    return dateString || "";
  }

  // Special handling for ISO strings with timezone (like "2025-12-08T18:30:00.000Z")
  if (dateString.includes('T') && dateString.includes('Z')) {
    try {
      // For dates with timezone, extract date parts directly to avoid timezone issues
      const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        // Convert to DD/MM/YYYY format
        const converted = `${day}/${month}/${year}`;
        return converted;
      }
    } catch (error) {
      console.error('Error parsing ISO date string:', error);
    }
  }
  
  // Check if the date is in XX/XX/YYYY format (could be MM/DD/YYYY or DD/MM/YYYY)
  const xyxyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (xyxyyyy) {
    const [, first, second, year] = xyxyyyy;
    const firstNum = parseInt(first, 10);
    const secondNum = parseInt(second, 10);
    
    // If first number > 12, it's likely DD/MM/YYYY format - keep as is
    if (firstNum > 12) {
      return dateString;
    }
    
    // If second number > 12, it's likely MM/DD/YYYY - convert to DD/MM/YYYY
    if (secondNum > 12) {
      const converted = `${second.padStart(2, '0')}/${first.padStart(2, '0')}/${year}`;
      return converted;
    }
    
    // If both numbers <= 12, we need to determine if it's DD/MM or MM/DD
    // Since we want DD/MM/YYYY format, assume it's MM/DD/YYYY and convert to DD/MM/YYYY
    const converted = `${second.padStart(2, '0')}/${first.padStart(2, '0')}/${year}`;
    return converted;
  }
  
  // Try to parse and format the date
  try {
    // Handle ISO format dates specifically (YYYY-MM-DD)
    if (dateString.includes('-')) {
      // For simple ISO dates (YYYY-MM-DD), parse directly to avoid timezone issues
      const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        // Convert to DD/MM/YYYY format
        const converted = `${day}/${month}/${year}`;
        return converted;
      }
      
      // For complex ISO dates with time, avoid Date object to prevent timezone issues
      const complexIsoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (complexIsoMatch) {
        const [, year, month, day] = complexIsoMatch;
        // Convert to DD/MM/YYYY format
        const converted = `${day}/${month}/${year}`;
        return converted;
      }
    }
    
    // Last resort: try Date object
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      // Use UTC methods to avoid timezone issues and format as DD/MM/YYYY
      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      const converted = `${day}/${month}/${year}`;
      return converted;
    }
  } catch {
    return dateString; // If parsing fails, return original
  }
  return dateString;
};

/**
 * Convert DD/MM/YYYY or "DD Month YYYY" to YYYY-MM-DD for date input fields
 */
export const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString || dateString === "NA" || dateString === "-" || dateString.trim() === "") {
    return "";
  }
  
  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Special handling for ISO strings with timezone (like "2025-12-08T18:30:00.000Z")
  if (dateString.includes('T') && dateString.includes('Z')) {
    try {
      // Extract just the date part to avoid timezone conversion issues
      const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error parsing ISO date string:', error);
    }
  }
  
  // Handle "DD Month YYYY" format (e.g., "13 September 2025")
  const namedDateMatch = dateString.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (namedDateMatch) {
    const [, day, monthName, year] = namedDateMatch;
    const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex !== -1) {
      const month = (monthIndex + 1).toString().padStart(2, '0');
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }
  
  // Handle "DD Month YYYY" format (e.g., "13 September 2025")
  const inputNamedDateMatch = dateString.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (inputNamedDateMatch) {
    const [, day, monthName, year] = inputNamedDateMatch;
    const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex !== -1) {
      const month = (monthIndex + 1).toString().padStart(2, '0');
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }
  
  // If in DD/MM/YYYY format, convert to YYYY-MM-DD
  const ddmmyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try Date parsing with timezone handling
  try {
    // Handle other ISO format dates
    if (dateString.includes('-')) {
      const complexIsoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (complexIsoMatch) {
        const [, year, month, day] = complexIsoMatch;
        return `${year}-${month}-${day}`;
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Use UTC methods to avoid timezone issues
        const yyyy = date.getUTCFullYear();
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(date.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    
    // For other formats, try standard parsing
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch (error) {
    console.error('Error parsing date string:', error);
    // If parsing fails, return empty string
  }
  
  return "";
};

/**
 * Convert YYYY-MM-DD (from date input) back to DD/MM/YYYY for storage
 * This maintains backward compatibility with existing Google Sheets format
 */
export const formatDateFromInput = (inputDate: string): string => {
  if (!inputDate || inputDate.trim() === "") {
    return "";
  }
  
  // If in YYYY-MM-DD format, convert to DD/MM/YYYY
  const yyyymmdd = inputDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd;
    return `${dd}/${mm}/${yyyy}`;
  }
  
  return inputDate;
};

/**
 * Format date for submission to Google Sheets (convert to DD/MM/YYYY format)
 * Google Sheets will store dates in DD/MM/YYYY format as plain text
 */
export const formatDateForSubmission = (dateString: string | undefined | null): string => {
  if (!dateString || dateString === "NA" || dateString.trim() === "") {
    return dateString || "";
  }

  // Special handling for ISO strings with timezone (like "2025-12-08T18:30:00.000Z")
  if (dateString.includes('T') && dateString.includes('Z')) {
    try {
      // For dates with timezone, extract date parts directly to avoid timezone issues
      const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        // Convert to DD/MM/YYYY format for Google Sheets
        const converted = `${day}/${month}/${year}`;
        return converted;
      }
    } catch (error) {
      console.error('Error parsing ISO date string:', error);
    }
  }
  
  // Check if the date is in XX/XX/YYYY format (could be MM/DD/YYYY or DD/MM/YYYY)
  const xyxyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (xyxyyyy) {
    const [, first, second, year] = xyxyyyy;
    const firstNum = parseInt(first, 10);
    const secondNum = parseInt(second, 10);
    
    // If first number > 12, it's likely DD/MM/YYYY format - keep as is
    if (firstNum > 12) {
      return dateString;
    }
    
    // If second number > 12, it's likely MM/DD/YYYY - convert to DD/MM/YYYY
    if (secondNum > 12) {
      const converted = `${second.padStart(2, '0')}/${first.padStart(2, '0')}/${year}`;
      return converted;
    }
    
    // If both numbers <= 12, we need to determine if it's DD/MM or MM/DD
    // Since we want DD/MM/YYYY format, assume it's MM/DD/YYYY and convert to DD/MM/YYYY
    const converted = `${second.padStart(2, '0')}/${first.padStart(2, '0')}/${year}`;
    return converted;
  }
  
  // Handle YYYY-MM-DD format (from HTML date input)
  const yyyymmdd = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    // Convert YYYY-MM-DD to DD/MM/YYYY format
    const converted = `${day}/${month}/${year}`;
    return converted;
  }
  
  // Try to parse and format the date
  try {
    // Handle ISO format dates specifically (YYYY-MM-DD)
    if (dateString.includes('-')) {
      // For simple ISO dates (YYYY-MM-DD), parse directly to avoid timezone issues
      const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        // Convert to DD/MM/YYYY format
        const converted = `${day}/${month}/${year}`;
        return converted;
      }
      
      // For complex ISO dates with time, avoid Date object to prevent timezone issues
      const complexIsoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (complexIsoMatch) {
        const [, year, month, day] = complexIsoMatch;
        // Convert to DD/MM/YYYY format
        const converted = `${day}/${month}/${year}`;
        return converted;
      }
    }
    
    // Last resort: try Date object
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      // Use UTC methods to avoid timezone issues and format as DD/MM/YYYY
      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      const converted = `${day}/${month}/${year}`;
      return converted;
    }
  } catch {
    return dateString; // If parsing fails, return original
  }

  return dateString;
};

/**
 * Validate if a date string is valid
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString || dateString === "NA" || dateString === "-") {
    return true; // Consider these as valid (empty/placeholder values)
  }
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Get current date in DD/MM/YYYY (13 September 2025) format
 */
export const getCurrentDateDDMMYYYY = (): string => {
  const now = new Date();
  const day = now.getDate();
  
  const monthIndex = now.getMonth();
  const year = now.getFullYear();
  const monthName = MONTH_NAMES[monthIndex];
  return `${day} ${monthName} ${year}`;
};

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDateYYYYMMDD = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a date to DD Month YYYY format (13 September 2025)
 * This is a utility for creating consistently formatted date strings
 */
export const formatToNamedDate = (date: Date): string => {
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  const monthName = MONTH_NAMES[monthIndex];
  return `${day} ${monthName} ${year}`;
};

/**
 * Parse a date string and return a Date object
 * Handles multiple input formats
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString || dateString === "NA" || dateString === "-") {
    return null;
  }
  
  // Handle "DD Month YYYY" format
  const parseDateNamedMatch = dateString.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (parseDateNamedMatch) {
    const [, day, monthName, year] = parseDateNamedMatch;
    const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex !== -1) {
      return new Date(parseInt(year), monthIndex, parseInt(day));
    }
  }
  
  // Handle other formats
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};
