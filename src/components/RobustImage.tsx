"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface RobustImageProps {
  photoUrl: string;
  studentName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const RobustImage = ({ photoUrl, studentName, className = "", size = "md" }: RobustImageProps) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [validImageUrl, setValidImageUrl] = useState<string | null>(null);

  // Generate all possible URL formats for Google Drive
  const generateUrlFormats = (url: string): string[] => {
    if (!url || url === "NA" || url === "Not specified" || url.trim() === "") {
      return [];
    }

    // Check if it's a Google Drive URL
    const isGoogleDriveUrl = url.includes('drive.google.com') || url.includes('googleusercontent.com');
    
    if (isGoogleDriveUrl) {
      // Extract file ID using various patterns
      const fileIdPatterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /[?&]id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/,
        /\/open\?id=([a-zA-Z0-9_-]+)/
      ];
      
      let fileId = null;
      for (const pattern of fileIdPatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          fileId = match[1];
          break;
        }
      }
      
      if (fileId) {
        // Use the most reliable Google Drive URL formats in order of preference
        const driveUrls = [
          `https://lh3.googleusercontent.com/d/${fileId}=w400-h400-c`, // Google's CDN - most reliable
          `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`, // Thumbnail with explicit size
          `https://drive.google.com/uc?export=view&id=${fileId}`, // Direct view
          url // Original URL as fallback
        ];
        return driveUrls;
      }
    }
    
    // For non-Google Drive URLs, just return the original URL
    return [url];
  };

  const urlFormats = generateUrlFormats(photoUrl);
  const currentUrl = urlFormats[currentUrlIndex] || "";

  // Function to test if an image URL is accessible
  const testImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      
      // Set CORS attributes
      img.crossOrigin = 'anonymous';
      
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };
      
      img.onload = () => {
        cleanup();
        resolve(true);
      };
      
      img.onerror = () => {
        cleanup();
        resolve(false);
      };
      
      // Set a reasonable timeout
      setTimeout(() => {
        cleanup();
        resolve(false);
      }, 5000); // 5 second timeout
      
      img.src = url;
    });
  };

  const handleError = async () => {
    // console.log(`[RobustImage] ❌ Image failed to load (${studentName}): ${currentUrl} (index: ${currentUrlIndex})`);
    
    if (currentUrlIndex < urlFormats.length - 1) {
      // Try next URL format
      // console.log(`[RobustImage] 🔄 Trying next URL format (${studentName}) (${currentUrlIndex + 1}/${urlFormats.length - 1})`);
      setCurrentUrlIndex(currentUrlIndex + 1);
      setHasError(false);
      setIsLoading(true);
      setValidImageUrl(null);
    } else {
      // All formats tried - show fallback
      // console.log(`[RobustImage] 💀 All URL formats failed, showing fallback (${studentName})`);
      setHasError(true);
      setIsLoading(false);
      setValidImageUrl(null);
    }
  };

  const handleLoad = () => {
    // console.log(`[RobustImage] ✅ Image loaded successfully (${studentName}): ${currentUrl}`);
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
    setHasError(false);
    setIsLoading(false);
  };

  // Test current URL when it changes
  useEffect(() => {
    if (currentUrl && !hasError) {
      // console.log(`[RobustImage] Testing image URL (${studentName}): ${currentUrl}`);
      testImageUrl(currentUrl).then((isValid) => {
        if (isValid) {
          // console.log(`[RobustImage] ✅ Valid image URL found (${studentName}): ${currentUrl}`);
          setValidImageUrl(currentUrl);
          setIsLoading(false);
        } else {
          // console.log(`[RobustImage] ❌ Invalid image URL (${studentName}): ${currentUrl}`);
          handleError();
        }
      });
    }
  }, [currentUrl, hasError]);

  // Reset when photoUrl changes
  useEffect(() => {
    // console.log(`[RobustImage] Photo URL changed (${studentName}): ${photoUrl}`);
    // console.log(`[RobustImage] Generated URL formats (${studentName}):`, urlFormats);
    setCurrentUrlIndex(0);
    setHasError(false);
    setIsLoading(true);
    setValidImageUrl(null);
    
    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    // Set a timeout to try next URL if current one takes too long
    const timeout = setTimeout(() => {
      if (isLoading && !hasError && !validImageUrl) {
        // console.log(`[RobustImage] ⏰ Image loading timeout (${studentName}), trying next URL format`);
        handleError(); // This will try the next URL format
      }
    }, 10000); // 10 second timeout (increased from 8 seconds)
    
    setLoadingTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [photoUrl]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, []);

  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-20 h-24",
    lg: "w-32 h-32"
  };

  // Safe fallback for student name
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  if (urlFormats.length === 0) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
          {getInitials(studentName)}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {validImageUrl && !hasError && (
        <AvatarImage 
          src={validImageUrl}
          alt={studentName || 'Student'}
          className="object-cover"
          referrerPolicy="no-referrer"
          onError={handleError}
          onLoad={handleLoad}
          crossOrigin="anonymous"
        />
      )}
      <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
        {getInitials(studentName)}
      </AvatarFallback>
    </Avatar>
  );
};

export default RobustImage;