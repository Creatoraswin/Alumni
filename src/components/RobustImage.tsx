"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getDirectImageUrl } from "@/services/apiService";

interface RobustImageProps {
  photoUrl: string;
  studentName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const RobustImage = ({ photoUrl, studentName, className = "", size = "md" }: RobustImageProps) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

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
        return [
          `https://lh3.googleusercontent.com/d/${fileId}=w400-h400-c`, // Google's CDN - most reliable
          `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`, // Thumbnail with explicit size
          `https://drive.google.com/uc?export=view&id=${fileId}`, // Direct view
          url // Original URL as fallback
        ];
      }
    }
    
    // For non-Google Drive URLs, just return the original URL resolved
    const resolved = getDirectImageUrl(url);
    if (resolved.includes('/Uploads/')) {
      // Build fallback cascade across common image extensions
      const exts = ['.webp', '.jpg', '.jpeg', '.png'];
      const base = resolved.replace(/\.(webp|jpg|jpeg|png|gif)$/i, '');
      const currentExt = (resolved.match(/\.(webp|jpg|jpeg|png|gif)$/i) || [''])[0].toLowerCase();
      // Start with original, then try other extensions
      const variants = [resolved, ...exts.filter(e => e !== currentExt).map(e => base + e)];
      return variants;
    }
    return [resolved];
  };

  const urlFormats = generateUrlFormats(photoUrl);
  const currentUrl = urlFormats[currentUrlIndex] || "";

  const handleError = () => {
    if (currentUrlIndex < urlFormats.length - 1) {
      // Try next URL format
      setCurrentUrlIndex(prev => prev + 1);
    } else {
      // All formats tried - show fallback
      setHasError(true);
    }
  };

  // Reset when photoUrl changes
  useEffect(() => {
    setCurrentUrlIndex(0);
    setHasError(false);
  }, [photoUrl]);

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

  if (urlFormats.length === 0 || hasError) {
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
      <AvatarImage 
        src={currentUrl}
        alt={studentName || 'Student'}
        className="object-cover"
        referrerPolicy="no-referrer"
        onError={handleError}
      />
      <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
        {getInitials(studentName)}
      </AvatarFallback>
    </Avatar>
  );
};

export default RobustImage;