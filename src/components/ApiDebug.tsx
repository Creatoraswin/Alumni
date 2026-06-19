"use client";

import React, { useState, useEffect } from 'react';
import { fetchAlumniSpotlight, testApiConnectivity } from '@/services/apiService';

const ApiDebug: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [spotlightData, setSpotlightData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runTests = async () => {
      try {
        // Test API connectivity
        setApiStatus('Testing API connectivity...');
        const isConnected = await testApiConnectivity();
        setApiStatus(isConnected ? '✅ API Connected' : '❌ API Connection Failed');
        
        if (isConnected) {
          // Test fetching alumni spotlight data
          setApiStatus('Fetching alumni spotlight data...');
          const data = await fetchAlumniSpotlight();
          setSpotlightData(data);
          setApiStatus(`✅ API Connected - Found ${data.length} spotlights`);
        }
      } catch (err) {
        console.error('Debug test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setApiStatus('❌ Test Failed');
      }
    };

    runTests();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">API Debug Information</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold">API Status:</h3>
        <p className={apiStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>{apiStatus}</p>
      </div>
      
      {error && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Error:</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {spotlightData && (
        <div>
          <h3 className="text-lg font-semibold">Spotlight Data:</h3>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto max-h-96">
            {JSON.stringify(spotlightData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiDebug;