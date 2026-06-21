"use client";

import React, { useEffect, useState } from 'react';
import { fetchStudentsData, Student } from '@/services/apiService';

const StatusTest = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await fetchStudentsData(true);
        setStudents(data);

        data.slice(0, 5).forEach((student, index) => {});

        // Count status distribution
        const statusCounts: Record<string, number> = {};
        data.forEach(student => {
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
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  if (loading) {
    return <div className="p-8">Loading student data...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Status Test</h1>
      <p>Total students: {students.length}</p>
      
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">First 5 Students:</h2>
        {students.slice(0, 5).map((student, index) => (
          <div key={index} className="border p-2 mb-2">
            <p>Name: {student.name}</p>
            <p>Registration No: {student.registrationNo}</p>
            <p>Status: {student.Status === undefined ? 'undefined' : student.Status} ({typeof student.Status})</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusTest;