"use client";

import { useState, useEffect } from "react";
import { fetchStudentsData, Student } from "@/services/apiService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RobustImage from "./RobustImage";

const ImageDebugger = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchStudentsData();
        // console.log('[ImageDebugger] Loaded students:', data.length);
        
        // Filter students with photo URLs
        const studentsWithPhotos = data.filter(student => 
          student.photoUrl && 
          student.photoUrl !== "NA" && 
          student.photoUrl !== "Not specified" &&
          student.photoUrl.trim() !== ""
        );
        
        // console.log('[ImageDebugger] Students with photos:', studentsWithPhotos.length);
        // console.log('[ImageDebugger] Sample photo URLs:', 
        //   studentsWithPhotos.slice(0, 5).map(s => ({ name: s.name, url: s.photoUrl }))
        // );
        
        setStudents(studentsWithPhotos);
        if (studentsWithPhotos.length > 0) {
          setSelectedStudent(studentsWithPhotos[0]);
        }
      } catch (error) {
        // console.error('[ImageDebugger] Error loading students:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const testImageUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
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
      
      setTimeout(() => {
        cleanup();
        resolve(false);
      }, 5000);
      
      img.src = url;
    });
  };

  const testAllUrls = async () => {
    if (!selectedStudent) return;
    
    // console.log(`[ImageDebugger] Testing URLs for ${selectedStudent.name}:`);
    // console.log(`[ImageDebugger] Original URL: ${selectedStudent.photoUrl}`);
    
    // Test original URL
    const originalWorks = await testImageUrl(selectedStudent.photoUrl);
    // console.log(`[ImageDebugger] Original URL works: ${originalWorks}`);
    
    // Test Google Drive formats if it's a Google Drive URL
    if (selectedStudent.photoUrl.includes('drive.google.com')) {
      const fileIdMatch = selectedStudent.photoUrl.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2]) : null;
      
      if (fileId) {
        // console.log(`[ImageDebugger] Extracted file ID: ${fileId}`);
        
        const testUrls = [
          `https://lh3.googleusercontent.com/d/${fileId}=w400-h400-c`,
          `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`,
          `https://drive.google.com/uc?export=view&id=${fileId}`,
        ];
        
        for (const testUrl of testUrls) {
          const works = await testImageUrl(testUrl);
          // console.log(`[ImageDebugger] ${testUrl} works: ${works}`);
        }
      }
    }
  };

  if (loading) {
    return <div>Loading students...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Image Debugger</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3>Students with Photos ({students.length})</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <Button
                  key={student.id}
                  variant={selectedStudent?.id === student.id ? "default" : "outline"}
                  className="w-full justify-start text-left"
                  onClick={() => setSelectedStudent(student)}
                >
                  {student.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedStudent && (
          <Card>
            <CardHeader>
              <h3>Selected: {selectedStudent.name}</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Photo URL:</strong>
                <div className="break-all text-sm bg-gray-100 p-2 rounded">
                  {selectedStudent.photoUrl}
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <h4 className="font-semibold">RobustImage Component:</h4>
                <RobustImage
                  photoUrl={selectedStudent.photoUrl}
                  studentName={selectedStudent.name}
                  size="lg"
                  className="border-2"
                />
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <h4 className="font-semibold">Standard IMG Tag:</h4>
                <img
                  src={selectedStudent.photoUrl}
                  alt={selectedStudent.name}
                  className="w-32 h-32 object-cover border-2 rounded"
                  onError={(e) => {
                    // console.log(`[ImageDebugger] Standard img failed for ${selectedStudent.name}:`, selectedStudent.photoUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={() => {
                    // console.log(`[ImageDebugger] Standard img loaded for ${selectedStudent.name}:`, selectedStudent.photoUrl);
                  }}
                />
              </div>
              
              <Button onClick={testAllUrls} className="w-full">
                Test All URL Formats (Check Console)
              </Button>
              
              <div className="mt-4 p-3 bg-background rounded border text-xs">
                <h5 className="font-semibold mb-2">Debug Info:</h5>
                <div className="space-y-1">
                  <div><span className="font-medium">Original URL:</span> {selectedStudent.photoUrl}</div>
                  <div><span className="font-medium">URL Type:</span> {selectedStudent.photoUrl.includes('drive.google.com') ? 'Google Drive' : 'Direct URL'}</div>
                  <div><span className="font-medium">URL Length:</span> {selectedStudent.photoUrl.length} characters</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImageDebugger;