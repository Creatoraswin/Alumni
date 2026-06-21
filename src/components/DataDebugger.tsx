"use client";

import React, { useState, useEffect } from 'react';
import { fetchStudentsData, Student } from '@/services/apiService';

const DataDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<{
    loading: boolean;
    error: string | null;
    studentCount: number;
    allStudentCount: number;
    rawResponse: Student | null;
  }>({
    loading: true,
    error: null,
    studentCount: 0,
    allStudentCount: 0,
    rawResponse: null,
  });

  useEffect(() => {
    const testDataFetch = async () => {
      try {
        // Test fetching approved students only
        const approvedStudents = await fetchStudentsData(false);

        // Test fetching all students
        const allStudents = await fetchStudentsData(true);

        setDebugInfo({
          loading: false,
          error: null,
          studentCount: approvedStudents.length,
          allStudentCount: allStudents.length,
          rawResponse: allStudents[0] || null, // Show first student as sample
        });
      } catch (error) {
        console.error('Data fetch error:', error);
        setDebugInfo({
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          studentCount: 0,
          allStudentCount: 0,
          rawResponse: null,
        });
      }
    };

    testDataFetch();
  }, []);

  if (debugInfo.loading) {
    return <div className="p-4 bg-blue-50 border border-blue-200 rounded">Loading data debug info...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Data Debug Information</h3>
      
      {debugInfo.error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded mb-4">
          <strong>Error:</strong> {debugInfo.error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <strong>✅ Data Fetch Successful</strong>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white border rounded">
              <div className="text-sm text-gray-600">Approved Students</div>
              <div className="text-2xl font-bold text-green-600">{debugInfo.studentCount}</div>
            </div>
            
            <div className="p-3 bg-white border rounded">
              <div className="text-sm text-gray-600">Total Students</div>
              <div className="text-2xl font-bold text-blue-600">{debugInfo.allStudentCount}</div>
            </div>
          </div>
          
          {debugInfo.rawResponse && (
            <div className="p-4 bg-white border rounded">
              <div className="text-sm font-semibold mb-2">Sample Student Data:</div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(debugInfo.rawResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        Check the browser console for detailed logs during data fetching.
      </div>
    </div>
  );
};

export default DataDebugger;