"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Linkedin, Loader2 } from "lucide-react";

// Declare LinkedIn global object
declare global {
  interface Window {
    IN?: {
      parse?: () => void;
    };
  }
}

const LinkedInFeed = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle loading of LinkedIn embed
  useEffect(() => {
    // Function to initialize LinkedIn widgets
    const initLinkedIn = () => {
      if (typeof window !== 'undefined' && window.IN && window.IN.parse) {
        try {
          window.IN.parse();
          setLoading(false);
        } catch (err) {
          console.error('Error parsing LinkedIn widgets:', err);
          setError("Failed to load LinkedIn feed. Please try again later.");
          setLoading(false);
        }
      } else {
        // If LinkedIn script is not available, show fallback after a delay
        setTimeout(() => {
          setLoading(false);
          setError(null);
        }, 3000);
      }
    };

    // Check if LinkedIn script is already loaded
    if (typeof window !== 'undefined' && window.IN) {
      initLinkedIn();
      return;
    }

    // Try to load LinkedIn script
    const loadLinkedInScript = () => {
      if (typeof document === 'undefined') return;
      
      // Create script element for LinkedIn profile badge
      const script = document.createElement('script');
      script.src = 'https://platform.linkedin.com/badges/js/profile.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('LinkedIn script loaded');
        // Wait for script to fully initialize
        setTimeout(initLinkedIn, 1000);
      };
      script.onerror = () => {
        console.error('Failed to load LinkedIn script');
        setError("Failed to load LinkedIn feed. Please try again later.");
        setLoading(false);
      };

      // Add script to document head
      document.head.appendChild(script);
    };

    loadLinkedInScript();

    // Cleanup function
    return () => {
      // Note: We don't remove the script as it might be used elsewhere
    };
  }, []);

  const handleViewAllClick = () => {
    window.open("https://www.linkedin.com/in/centurion-university-andhra-pradesh-5050062a6/", "_blank");
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full mr-3">
              <Linkedin className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-primary">LinkedIn Recent Activities</h2>
          </div>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleViewAllClick}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View All
          </Button>
        </div>
        <p className="text-muted-foreground mb-4">
          Stay updated with our latest activities, achievements, and industry insights on LinkedIn.
        </p>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-muted-foreground">Loading LinkedIn feed...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Linkedin className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Error Loading Feed</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* LinkedIn Profile Badge */}
            <div className="flex justify-center">
              <script type="text/javascript" src="https://platform.linkedin.com/badges/js/profile.js" async defer></script>
              <div className="badge-container">
                <div className="linkedin-badge-embed" data-li-badge-type="member" data-li-url="https://www.linkedin.com/in/centurion-university-andhra-pradesh-5050062a6/" data-li-theme="light"></div>
              </div>
            </div>
            
            {/* LinkedIn Feed Information */}
            <div className="border rounded-lg p-4 bg-muted/10">
              <p className="text-center text-muted-foreground mb-4">
                For the most recent activities, please visit our LinkedIn profile directly:
              </p>
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={handleViewAllClick}
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  View Recent Activities
                </Button>
              </div>
            </div>
          </div>
        )}
        
            <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={handleViewAllClick}
          >
            <Linkedin className="mr-2 h-4 w-4" />
            Visit Our LinkedIn Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkedInFeed;