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
 * Format date for display (convert to DD/MM/YYYY (13 September 2025) format)
 * Handles various input formats: MM/DD/YYYY, YYYY-MM-DD, ISO strings
 */
export const formatDateForDisplay = (dateString: string | undefined | null): string => {
  if (!dateString || dateString === "NA" || dateString === "-" || dateString.trim() === "") {
    return dateString || '-';
  }
  
  // Check if the date is already in the correct named format (DD Month YYYY)
  const alreadyNamedFormat = dateString.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (alreadyNamedFormat) {
    const [, day, monthName, year] = alreadyNamedFormat;
    const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex !== -1) {
      return dateString;
    }
  }
  
  // Special handling for ISO strings with timezone (like "2025-12-08T18:30:00.000Z")
  if (dateString.includes('T') && dateString.includes('Z')) {
    try {
      // For ISO strings with timezone, extract just the date part to avoid timezone issues
      // This prevents the off-by-one date bug mentioned in project memory
      const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const monthIndex = parseInt(month, 10) - 1;
        const monthName = MONTH_NAMES[monthIndex] || month;
        const converted = `${parseInt(day, 10)} ${monthName} ${year}`;
        return converted;
      }
    } catch (error) {
      // Silent error handling
    }
  }
  
  // Check if the date is in XX/XX/YYYY format (could be MM/DD/YYYY or DD/MM/YYYY)
  const xyxyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (xyxyyyy) {
    const [, first, second, year] = xyxyyyy;
    const firstNum = parseInt(first, 10);
    const secondNum = parseInt(second, 10);
    
    // If first number > 12, it's likely DD/MM/YYYY format already - convert to named format
    if (firstNum > 12) {
      const monthIndex = parseInt(second, 10) - 1;
      const monthName = MONTH_NAMES[monthIndex] || second;
      const converted = `${first} ${monthName} ${year}`;
      return converted;
    }
    
    // If second number > 12, it's likely MM/DD/YYYY and needs conversion
    if (secondNum > 12) {
      const monthIndex = parseInt(first, 10) - 1;
      const monthName = MONTH_NAMES[monthIndex] || first;
      const converted = `${second} ${monthName} ${year}`;
      return converted;
    }
    
    // If both numbers <= 12, we need to check the source more carefully
    // Based on your API service, it returns DD/MM/YYYY format, so treat as DD/MM/YYYY
    const monthIndex = parseInt(second, 10) - 1;
    const monthName = MONTH_NAMES[monthIndex] || second;
    const converted = `${first} ${monthName} ${year}`;
    return converted;
  }
  
  // Try to parse and format the date for other formats
  try {
    // Handle ISO format dates specifically (YYYY-MM-DD)
    if (dateString.includes('-')) {
      // For simple ISO dates (YYYY-MM-DD), parse directly to avoid timezone issues
      const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const monthIndex = parseInt(month, 10) - 1;
        const monthName = MONTH_NAMES[monthIndex] || month;
        const converted = `${parseInt(day, 10)} ${monthName} ${year}`;
        return converted;
      }
      
      // For complex ISO dates with time, avoid Date object to prevent timezone issues
      const complexIsoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (complexIsoMatch) {
        const [, year, month, day] = complexIsoMatch;
        const monthIndex = parseInt(month, 10) - 1;
        const monthName = MONTH_NAMES[monthIndex] || month;
        const converted = `${parseInt(day, 10)} ${monthName} ${year}`;
        return converted;
      }
    }
    
    // Last resort: try Date object but be careful with timezone
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      // Use UTC methods to avoid timezone issues
      const day = date.getUTCDate();
      const monthIndex = date.getUTCMonth();
      const year = date.getUTCFullYear();
      const monthName = MONTH_NAMES[monthIndex];
      const converted = `${day} ${monthName} ${year}`;
      return converted;
    }
  } catch (error) {
    // Silent error handling
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
  } catch {
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
 * Format date for submission to Google Sheets (convert to MM/DD/YYYY format)
 * Google Sheets expects MM/DD/YYYY format, so we convert DD/MM/YYYY to MM/DD/YYYY for storage
 * This fixes the issue where Google Sheets was misinterpreting DD/MM/YYYY as MM/DD/YYYY
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
        // Convert to MM/DD/YYYY for Google Sheets
        const converted = `${month}/${day}/${year}`;

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
    
    // If first number > 12, it's likely DD/MM/YYYY format - convert to MM/DD/YYYY
    if (firstNum > 12) {
      const converted = `${second.padStart(2, '0')}/${first.padStart(2, '0')}/${year}`;

      return converted;
    }
    
    // If second number > 12, it's likely MM/DD/YYYY already - keep as is
    if (secondNum > 12) {

      return dateString;
    }
    
    // If both numbers <= 12, we need to determine if it's DD/MM or MM/DD
    // Since we're coming from our app, assume it's DD/MM/YYYY and convert to MM/DD/YYYY
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
        // Convert to MM/DD/YYYY for Google Sheets
        const converted = `${month}/${day}/${year}`;

        return converted;
      }
      
      // For complex ISO dates with time, avoid Date object to prevent timezone issues
      const complexIsoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (complexIsoMatch) {
        const [, year, month, day] = complexIsoMatch;
        // Convert to MM/DD/YYYY for Google Sheets
        const converted = `${month}/${day}/${year}`;

        return converted;
      }
    }
    
    // Last resort: try Date object
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      // Use UTC methods to avoid timezone issues and format as MM/DD/YYYY
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = date.getUTCDate().toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      const converted = `${month}/${day}/${year}`;

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