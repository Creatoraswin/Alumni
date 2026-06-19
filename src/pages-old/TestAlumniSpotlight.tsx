"use client";

import React, { useEffect, useState } from 'react';
import { fetchAlumniSpotlight, AlumniSpotlightItem } from '@/services/apiService';

const TestAlumniSpotlight: React.FC = () => {
  const [spotlights, setSpotlights] = useState<AlumniSpotlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSpotlights = async () => {
      try {
        console.log('Test: Loading alumni spotlights...');
        setLoading(true);
        const data = await fetchAlumniSpotlight();
        console.log('Test: Fetched alumni spotlights:', data);
        setSpotlights(data);
      } catch (err) {
        console.error('Test: Failed to load alumni spotlights:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSpotlights();
  }, []);

  // Add a refresh function
  const refreshSpotlights = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlumniSpotlight();
      setSpotlights(data);
    } catch (err) {
      console.error('Test: Failed to refresh alumni spotlights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Alumni Spotlight Test</h1>
      
      <div className="mb-4">
        <button 
          onClick={refreshSpotlights}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh Data
        </button>
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading alumni spotlights...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>Error: {error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div>
          <p className="mb-4">Found {spotlights.length} alumni spotlights</p>
          
          {spotlights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spotlights.map((spotlight, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h2 className="text-xl font-bold">{spotlight.name}</h2>
                  <p>School: {spotlight.school}</p>
                  <p>Department: {spotlight.department}</p>
                  <p>Year of Graduation: {spotlight.yearOfGraduation}</p>
                  <p>Status: {spotlight.status}</p>
                  <p>Date Added: {spotlight.dateAdded}</p>
                  {spotlight.photoUrl && (
                    <img 
                      src={spotlight.photoUrl} 
                      alt={spotlight.name} 
                      className="mt-2 w-full h-32 object-cover rounded"
                      onError={(e) => {
                        console.log('Image failed to load:', spotlight.photoUrl);
                        // Try alternative Google Drive URL formats if the first one fails
                        const img = e.target as HTMLImageElement;
                        const url = img.src;

                        // Check if it's a Google Drive URL
                        if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
                          // Extract file ID
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
                            // Try alternative Google Drive URL formats
                            const alternativeUrls = [
                              `https://lh3.googleusercontent.com/d/${fileId}=w400-h400-c`,
                              `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`,
                              `https://drive.google.com/uc?export=view&id=${fileId}`
                            ];

                            // Try each alternative URL
                            for (const altUrl of alternativeUrls) {
                              if (altUrl !== url) {
                                img.src = altUrl;
                                break;
                              }
                            }
                          }
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No alumni spotlights found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestAlumniSpotlight;