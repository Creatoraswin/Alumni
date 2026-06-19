"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { fetchAlumniSpotlight, createAlumniSpotlight, updateAlumniSpotlight, deleteAlumniSpotlight, AlumniSpotlightItem, fetchStudentsData, uploadImageToDrive } from '@/services/apiService';
import { useAuth } from '@/contexts/useAuth';
import UniversalNav from '@/components/UniversalNav';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Building2, UserCheck, Star, ChevronLeft } from "lucide-react";
import { formatDateForDisplay, formatDateForSubmission } from '@/lib/dateUtils';
import SpotlightFilterSection from '@/components/SpotlightFilterSection';

const AlumniSpotlight: React.FC = () => {
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout } = useAuth();
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: spotlights = [], isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['alumniSpotlight'],
    queryFn: fetchAlumniSpotlight,
    staleTime: 1000 * 60 * 5, // 5 minutes for fresh data
    gcTime: 1000 * 60 * 30, // 30 minutes for cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Changed from false to true to ensure data is fetched on mount
    refetchOnReconnect: false, // Disable refetch on reconnect for better performance
  });
  
  // Add effect to refetch data when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<AlumniSpotlightItem>({ 
    dateAdded: '', 
    name: '', 
    yearOfGraduation: '', 
    school: '', 
    department: '', 
    registrationNo: '', 
    currentPosition: '', 
    company: '', 
    photoUrl: '', 
    achievement: '', 
    galleryLink: '',
    status: 'Pending'
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  // Update the default status filter for regular users
  // useEffect will handle setting the default status based on user role

  // Validation error state
  const [regNoError, setRegNoError] = useState<string>("");

  // Fetch students data for auto-fill functionality
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => fetchStudentsData(true), // Get all students including pending
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Only check for editor permissions if user is logged in
  const isEditor = isLoggedIn && (userRole === 'admin' || userRole === 'alumni-manager');
  const isAdmin = isLoggedIn && userRole === 'admin';
  
  // Set default status based on user role
  useEffect(() => {
    if (!isEditor && selectedStatus === "all") {
      setSelectedStatus("Approved");
    }
  }, [isEditor, selectedStatus]);

  const handleRegistrationChange = (value: string) => {
    // Validate that registration number exists in our alumni portal
    const regNo = value.toString().trim().toLowerCase();
    if (regNo) {
      const studentExists = students.some(student => {
        const studentReg = student.registrationNo.toString().trim().toLowerCase();
        const inputReg = regNo.toLowerCase();
        
        // Direct match
        if (studentReg === inputReg) return true;
        
        // Normalized match (remove spaces and special characters)
        const normalizedStudentReg = studentReg.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        const normalizedRegNo = inputReg.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        
        return normalizedStudentReg === normalizedRegNo;
      });
      
      if (!studentExists) {
        setRegNoError("Registration number does not exist in our alumni portal.");
      } else {
        setRegNoError("");
      }
    } else {
      setRegNoError("");
    }
    
    const s = students.find(st => {
      const studentReg = st.registrationNo.toString().trim().toLowerCase();
      const inputReg = value.trim().toLowerCase();
      
      // Direct match
      if (studentReg === inputReg) return true;
      
      // Normalized match (remove spaces and special characters)
      const normalizedStudentReg = studentReg.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      const normalizedInputReg = inputReg.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      
      return normalizedStudentReg === normalizedInputReg;
    });
    if (s) {
      setForm(prev => ({
        ...prev,
        registrationNo: s.registrationNo,
        name: s.name || prev.name,
        school: s.school || prev.school,
        department: s.department || prev.department,
        yearOfGraduation: s.graduationYear || prev.yearOfGraduation,
        currentPosition: s.currentPosition || prev.currentPosition,
        company: s.organisation || prev.company,
      }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToDrive(file);
      setForm(prev => ({ ...prev, photoUrl: url }));
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      dateAdded: '', 
      name: '', 
      yearOfGraduation: '', 
      school: '', 
      department: '', 
      registrationNo: '', 
      currentPosition: '', 
      company: '', 
      photoUrl: '', 
      achievement: '', 
      galleryLink: '',
      status: 'Pending'
    });
    setRegNoError("");
  };

  const onCreate = async () => {
    if (uploadingImage) return;
    
    // Validate that registration number exists in our alumni portal
    const regNo = form.registrationNo.toString().trim().toLowerCase();
    const studentExists = students.some(student => {
      const studentReg = student.registrationNo.toString().trim().toLowerCase();
      
      // Direct match
      if (studentReg === regNo) return true;
      
      // Normalized match (remove spaces and special characters)
      const normalizedStudentReg = studentReg.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      const normalizedRegNo = regNo.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      
      return normalizedStudentReg === normalizedRegNo;
    });
    
    if (!studentExists) {
      setRegNoError("Registration number does not exist in our alumni portal.");
      return;
    }
    
    setSaving(true);
    setRegNoError(""); // Clear any previous error
    try {
      await createAlumniSpotlight(form);
      resetForm();
      setShowForm(false);
      // refresh cache but avoid global loading indicators
      const next = await fetchAlumniSpotlight();
      queryClient.setQueryData(['alumniSpotlight'], next);
    } finally { setSaving(false); }
  };

  const onEdit = (idx: number) => {
    setEditingIndex(idx);
    setForm(spotlights[idx]);
    setShowForm(true);
  };

  const onUpdate = async () => {
    if (editingIndex === null) return;
    if (uploadingImage) return;
    setSaving(true);
    try {
      const target = spotlights[editingIndex];
      await updateAlumniSpotlight({ rowIndex: target.rowIndex }, form);
      setEditingIndex(null);
      resetForm();
      setShowForm(false);
      const next = await fetchAlumniSpotlight();
      queryClient.setQueryData(['alumniSpotlight'], next);
    } finally { setSaving(false); }
  };

  const onDelete = async (idx: number) => {
    const target = spotlights[idx];
    if (!target) return;
    setSaving(true);
    try {
      await deleteAlumniSpotlight({ rowIndex: target.rowIndex });
      const next = await fetchAlumniSpotlight();
      queryClient.setQueryData(['alumniSpotlight'], next);
    } finally { setSaving(false); }
  };

  const grouped = useMemo(() => {
    // Create a memoized date parser for better performance
    const dateCache = new Map<string, number>();
    
    const parse = (d: string) => {
      if (dateCache.has(d)) {
        return dateCache.get(d)!;
      }
      
      // supports DD/MM/YYYY
      const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        const year = parseInt(m[3], 10);
        const result = new Date(year, month, day).getTime();
        dateCache.set(d, result);
        return result;
      }
      const t = Date.parse(d);
      const result = isNaN(t) ? 0 : t;
      dateCache.set(d, result);
      return result;
    };
    
    // Sort all spotlights from latest to oldest
    const sorted = [...spotlights].sort((a, b) => {
      const ta = parse(a.dateAdded);
      const tb = parse(b.dateAdded);
      // Descending sort - latest first
      return tb - ta;
    });
    
    // Group by school > department for display
    const map = new Map<string, Map<string, AlumniSpotlightItem[]>>();
    sorted.forEach(s => {
      if (!map.has(s.school)) map.set(s.school, new Map());
      const deptMap = map.get(s.school)!;
      if (!deptMap.has(s.department)) deptMap.set(s.department, []);
      deptMap.get(s.department)!.push(s);
    });
    return map;
  }, [spotlights]);

  // Apply filters to spotlights before grouping
  const visibleSpotlights = useMemo(() => {
    // Ensure spotlights is an array
    if (!Array.isArray(spotlights)) {
      return [];
    }
    
    // Filter spotlights based on user role:
    // - Editors (admin/alumni-manager) can see all spotlights
    // - Regular users can only see approved spotlights
    const filteredSpotlights = isEditor 
      ? spotlights 
      : spotlights.filter(spotlight => spotlight.status === 'Approved');
    
    return filteredSpotlights.filter(spotlight => {
      const matchesSearch = !searchTerm || 
        spotlight.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotlight.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotlight.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotlight.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spotlight.achievement.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSchool = selectedSchool === "all" || spotlight.school === selectedSchool;
      const matchesDepartment = selectedDepartment === "all" || spotlight.department === selectedDepartment;
      const matchesStatus = selectedStatus === "all" || spotlight.status === selectedStatus;
      
      return matchesSearch && matchesSchool && matchesDepartment && matchesStatus;
    });
  }, [spotlights, isEditor, searchTerm, selectedSchool, selectedDepartment, selectedStatus]);

  // Get unique schools and departments for filters from student data (like Alumni Talks)
  const allSchools = Array.from(new Set(students.map(s => s.school).filter(Boolean))).sort();
  const allDepartments = Array.from(new Set(students.map(s => s.department).filter(Boolean))).sort();
  // Only show all statuses to editors, otherwise only show "Approved" for regular users
  const allStatuses = isEditor 
    ? Array.from(new Set(spotlights.map(s => s.status).filter(Boolean))).sort()
    : ["Approved"];
  
  // Remove the authentication check that was preventing public access
  // We only need to check for editor permissions when displaying edit controls

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav 
        isLoggedIn={isLoggedIn} 
        userRole={userRole} 
        currentStudent={currentStudent}
        currentDepartmentUser={currentDepartmentUser}
        onLogout={logout} 
        onLoginClick={() => router.push('/')} 
      />
      
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-center text-primary mb-6">Alumni Spotlight</h1>

          <SpotlightFilterSection
            totalCount={spotlights.length}
            visibleCount={visibleSpotlights.length}
            allSchools={allSchools}
            allDepartments={allDepartments}
            allStatuses={allStatuses}
            selectedSchool={selectedSchool}
            selectedDepartment={selectedDepartment}
            selectedStatus={selectedStatus}
            searchTerm={searchTerm}
            onSchoolChange={setSelectedSchool}
            onDepartmentChange={setSelectedDepartment}
            onStatusChange={setSelectedStatus}
            onSearchChange={setSearchTerm}
            onClear={() => { setSearchTerm(''); setSelectedSchool('all'); setSelectedDepartment('all'); setSelectedStatus('all'); }}
            showStatusFilter={isEditor} // Only show status filter to editors
          />

        {/* Only show the creation form to editors */}
        {isEditor && (
          <div className="mb-8 p-6 border rounded-2xl bg-white/80 shadow-elegant">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">{editingIndex === null ? 'Create Alumni Spotlight' : 'Edit Alumni Spotlight'}</h2>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                onClick={() => setShowForm(v => !v)}
              >
                {showForm ? 'Hide Form' : 'Add Spotlight'}
              </button>
            </div>
            {showForm && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date Added</label>
                <input
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  type="date"
                  value={form.dateAdded ? formatDateForSubmission(form.dateAdded) : ''}
                  onChange={(e) => setForm({...form, dateAdded: formatDateForDisplay(e.target.value)})}
                />
              </div>
               <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Registration No.</label>
                <input
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                    regNoError ? "border-red-500" : "border-input"
                  }`}
                  placeholder="Registration No."
                  value={form.registrationNo}
                  onChange={e => {
                    setForm({ ...form, registrationNo: e.target.value });
                    handleRegistrationChange(e.target.value);
                  }}
                />
                {regNoError && (
                  <p className="text-sm text-red-500">{regNoError}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Name of the Alumni</label>
                <input
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Name of the Alumni"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Year of Graduation</label>
                <input
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Year of Graduation"
                  value={form.yearOfGraduation}
                  onChange={e => setForm({ ...form, yearOfGraduation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">School</label>
                <select
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  value={form.school}
                  onChange={e => setForm({ ...form, school: e.target.value })}
                >
                  <option value="">Select School</option>
                  {allSchools.map(s => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department</label>
                <select
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {allDepartments.map(d => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
             
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Current Position</label>
                <input
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Current Position"
                  value={form.currentPosition}
                  onChange={e => setForm({ ...form, currentPosition: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company</label>
                <input
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Company/Organization"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Photo URL</label>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Photo URL"
                    value={form.photoUrl}
                    onChange={e => setForm({ ...form, photoUrl: e.target.value })}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Achievement</label>
                <textarea
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  rows={4}
                  placeholder="Describe the achievement"
                  value={form.achievement}
                  onChange={e => setForm({ ...form, achievement: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Gallery Link</label>
                <input
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Gallery Link (optional)"
                  value={form.galleryLink}
                  onChange={e => setForm({ ...form, galleryLink: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            )}
            {showForm && (
              <div className="mt-6 flex gap-3">
                {editingIndex === null ? (
                  <button
                    className="px-6 py-3 bg-primary text-white rounded-lg font-medium disabled:opacity-70 hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg flex items-center"
                    onClick={onCreate}
                    disabled={saving || uploadingImage || !!regNoError}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : 'Create Spotlight'}
                  </button>
                ) : (
                  <>
                    <button
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-70 hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center"
                      onClick={onUpdate}
                      disabled={saving || uploadingImage}
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : 'Update Spotlight'}
                    </button>
                    <button
                      className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors shadow-md hover:shadow-lg"
                      onClick={() => { setEditingIndex(null); resetForm(); }}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {isLoading && (!visibleSpotlights || visibleSpotlights.length === 0) ? (
          <div className="space-y-6">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border rounded-xl p-6 bg-white/80 shadow-elegant">
                  <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-4" />
                  <div className="h-5 w-64 bg-gray-200 animate-pulse rounded mb-6" />
                  <div className="h-48 w-full bg-gray-200 animate-pulse rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-2xl mx-auto">
              <h3 className="font-bold text-lg mb-2">Error Loading Alumni Spotlights</h3>
              <p>{error?.message || 'Failed to load alumni spotlights. Please try again later.'}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleSpotlights.length > 0 ? (
                visibleSpotlights.map((spotlight, idx) => (
                  <div
                    key={idx}
                    className="border rounded-xl bg-white shadow-elegant overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Image (Top) */}
                    <div className="relative bg-black aspect-[16/9] w-full">
                      {spotlight.photoUrl ? (
                        <img
                          src={spotlight.photoUrl}
                          alt={spotlight.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
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
                                  `https://lh3.googleusercontent.com/d/${fileId}=w800-h400-c`,
                                  `https://drive.google.com/thumbnail?id=${fileId}&sz=w800-h400`,
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
                      ) : (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Details (Bottom) */}
                    <div className="p-5 md:p-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xl font-bold leading-tight text-foreground">{spotlight.name}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold shadow-md whitespace-nowrap text-sm bg-primary">
                          <span>{spotlight.yearOfGraduation}</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-gray-600 space-y-1 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Position:</span>
                            <span className="font-medium">{spotlight.currentPosition}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Company:</span>
                            <span className="font-medium">{spotlight.company}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 line-clamp-3">
                          {spotlight.achievement}
                        </div>

                        {/* Status Badge */}
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            spotlight.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            spotlight.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {spotlight.status}
                          </span>
                        </div>

                        {/* Edit and Delete buttons for editors */}
                        {isEditor && (
                          <div className="mt-4 flex justify-end gap-2">
                            <button
                              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                              onClick={() => {
                                // Find the actual index in the original spotlights array
                                const actualIndex = spotlights.findIndex(s =>
                                  s.name === spotlight.name &&
                                  s.dateAdded === spotlight.dateAdded &&
                                  s.school === spotlight.school &&
                                  s.department === spotlight.department
                                );
                                if (actualIndex !== -1) {
                                  onEdit(actualIndex);
                                }
                              }}
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete the spotlight for ${spotlight.name}?`)) {
                                    // Find the actual index in the original spotlights array
                                    const actualIndex = spotlights.findIndex(s =>
                                      s.name === spotlight.name &&
                                      s.dateAdded === spotlight.dateAdded &&
                                      s.school === spotlight.school &&
                                      s.department === spotlight.department
                                    );
                                    if (actualIndex !== -1) {
                                      onDelete(actualIndex);
                                    }
                                  }
                                }}
                                disabled={saving}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    {searchTerm || selectedSchool !== "all" || selectedDepartment !== "all" || selectedStatus !== "all"
                      ? "No spotlights found matching your search criteria."
                      : "No alumni spotlights available at the moment."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AlumniSpotlight;