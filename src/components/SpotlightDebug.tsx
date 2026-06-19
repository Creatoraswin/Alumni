"use client";

import React, { useEffect, useState } from 'react';
import { fetchAlumniSpotlight } from '@/services/apiService';

const SpotlightDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const debugSpotlight = async () => {
      try {
        console.log('Debug: Starting alumni spotlight fetch...');
        setLoading(true);
        setError(null);
        
        // Log environment variables
        console.log('Debug: VITE_API_URL:', process.env.NEXT_PUBLIC_API_URL);
        console.log('Debug: VITE_API_KEY exists:', !!process.env.NEXT_PUBLIC_API_KEY);
        
        const data = await fetchAlumniSpotlight();
        console.log('Debug: Raw data received:', data);
        
        setDebugInfo({
          itemCount: data.length,
          items: data,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Debug: Error fetching alumni spotlight:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    debugSpotlight();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Alumni Spotlight Debug</h2>
      
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
          <p className="mt-2 text-muted-foreground">Debugging alumni spotlight...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {debugInfo && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Debug Information:</h3>
            <p>Items found: {debugInfo.itemCount}</p>
            <p>Timestamp: {debugInfo.timestamp}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Raw Data:</h3>
            <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto max-h-96 text-xs">
              {JSON.stringify(debugInfo.items, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotlightDebug;