"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { fetchAlumniTalks, createAlumniTalk, updateAlumniTalk, deleteAlumniTalk, AlumniTalkItem, uploadReportToDrive, uploadImageToDrive, getDirectImageUrl, extractGoogleDriveFileId, generateGoogleDriveUrls, Student, getDirectImageUrlSized } from '@/services/apiService';
import DriveImage from '@/components/DriveImage';
import TalksFilterSection from '@/components/TalksFilterSection';
import { useAuth } from '@/contexts/useAuth';
import UniversalNav from '@/components/UniversalNav';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';

const AlumniTalks: React.FC = () => {
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout } = useAuth();
  const router = useRouter();
  const isEditor = isLoggedIn && (userRole === 'admin' || userRole === 'alumni-manager');
  const isAdmin = isLoggedIn && userRole === 'admin';

  const queryClient = useQueryClient();
  const { data: talks = [], isLoading, isFetching } = useQuery({
    queryKey: ['alumniTalks'],
    queryFn: fetchAlumniTalks,
    staleTime: 1000 * 60 * 5, // 5 minutes for fresh data
    gcTime: 1000 * 60 * 30, // 30 minutes for cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false, // Disable refetch on reconnect for better performance
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [form, setForm] = useState<AlumniTalkItem>({ date: '', name: '', school: '', department: '', registrationNo: '', bannerPhotoUrl: '', reportUrl: '', talkon: '', galleryLink: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [registrationNo, setRegistrationNo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  // New state for additional filters
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  // Validation error state
  const [regNoError, setRegNoError] = useState<string>("");
  // Fast lookup maps for programme/year resolution
  const { students } = useAuth();
  const regToStudent = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => {
      const key = (s.registrationNo || '').toString().trim().toLowerCase();
      if (key) map.set(key, s);

      // Also add alternative keys for better matching
      const normalizedReg = key.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      if (normalizedReg && normalizedReg !== key) {
        map.set(normalizedReg, s);
      }
    });
    return map;
  }, [students]);
  const nameToStudent = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => {
      const key = (s.name || '').toString().trim().toLowerCase();
      if (key) map.set(key, s);

      // Also add alternative keys for better matching
      const normalized = key.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      if (normalized && normalized !== key) {
        map.set(normalized, s);
      }
    });
    return map;
  }, [students]);


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToDrive(file);
      setForm(prev => ({ ...prev, bannerPhotoUrl: url }));
    } finally { setUploadingImage(false); }
  };

  const handleReportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReport(true);
    try {
      const url = await uploadReportToDrive(file);
      setForm(prev => ({ ...prev, reportUrl: url }));
    } finally { setUploadingReport(false); }
  };

  const resetForm = () => {
    setForm({ date: '', name: '', school: '', department: '', registrationNo: '', bannerPhotoUrl: '', reportUrl: '', talkon: '', galleryLink: '' });
    setRegNoError("");
  };

  const onCreate = async () => {
    if (uploadingImage || uploadingReport) return;

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
      await createAlumniTalk(form);
      resetForm();
      // refresh cache but avoid global loading indicators
      const next = await fetchAlumniTalks();
      queryClient.setQueryData(['alumniTalks'], next);
    } finally { setSaving(false); }
  };

  const onEdit = (idx: number) => {
    setEditingIndex(idx);
    setForm(talks[idx]);
    setShowForm(true);
  };

  const onUpdate = async () => {
    if (editingIndex === null) return;
    if (uploadingImage || uploadingReport) return;
    setSaving(true);
    try {
      const target = talks[editingIndex];
      await updateAlumniTalk({ rowIndex: target.rowIndex }, form);
      setEditingIndex(null);
      resetForm();
      setShowForm(false);
      const next = await fetchAlumniTalks();
      queryClient.setQueryData(['alumniTalks'], next);
    } finally { setSaving(false); }
  };

  const onDelete = async (idx: number) => {
    const target = talks[idx];
    if (!target) return;
    setSaving(true);
    try {
      await deleteAlumniTalk({ rowIndex: target.rowIndex });
      const next = await fetchAlumniTalks();
      queryClient.setQueryData(['alumniTalks'], next);
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

    // Sort all talks from latest to oldest
    const sorted = [...talks].sort((a, b) => {
      const ta = parse(a.date);
      const tb = parse(b.date);
      // Descending sort - latest first
      return tb - ta;
    });

    // Group by school > department for display
    const map = new Map<string, Map<string, AlumniTalkItem[]>>();
    sorted.forEach(t => {
      if (!map.has(t.school)) map.set(t.school, new Map());
      const deptMap = map.get(t.school)!;
      if (!deptMap.has(t.department)) deptMap.set(t.department, []);
      deptMap.get(t.department)!.push(t);
    });
    return map;
  }, [talks]);

  // Build dropdowns from existing students for school/department and autofill by registration
  const allSchools = Array.from(new Set(students.map(s => s.school).filter(Boolean))).sort();
  const filteredDepartments = Array.from(new Set(
    students
      .filter(s => (selectedSchool === "all" || s.school === selectedSchool))
      .map(s => s.department)
      .filter(Boolean)
  )).sort();

  // New dropdowns for year and programme
  const allYears = Array.from(new Set(students.map(s => s.graduationYear).filter(Boolean))).sort().reverse();
  const allProgrammes = Array.from(new Set(students.map(s => s.programme).filter(Boolean))).sort();

  const handleRegistrationChange = (value: string) => {
    setRegistrationNo(value);

    // Validate that registration number exists in our alumni portal
    const regNo = value.toString().trim();
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
      }));
    }
  };


  // Apply filters to talks before grouping and ensure latest to oldest order
  const visibleTalks = useMemo(() => {
    // Ensure talks is an array
    if (!Array.isArray(talks)) {
      return [];
    }

    const term = searchTerm.trim().toLowerCase();
    const filtered = talks.filter(t => {
      // Role-based access control
      if (userRole === "department" && currentDepartmentUser && t.department !== currentDepartmentUser.department) return false;
      if (userRole === "school" && currentDepartmentUser && t.school !== currentDepartmentUser.department) return false;

      if (selectedSchool !== 'all' && t.school !== selectedSchool) return false;
      if (selectedDepartment !== 'all' && t.department !== selectedDepartment) return false;
      if (selectedYear !== 'all') {
        // Find the student associated with this talk to check their graduation year
        // First try to match by registration number
        const regKey = (t.registrationNo || '').toString().trim().toLowerCase();
        let source = regKey ? regToStudent.get(regKey) : undefined;

        // If no direct match, try normalized registration number
        if (!source && regKey) {
          const normalizedReg = regKey.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
          if (normalizedReg) {
            source = regToStudent.get(normalizedReg) || regToStudent.get(normalizedReg.toLowerCase());
          }
        }

        // If no match by registration number, try to match by name
        if (!source) {
          const nameKey = (t.name || '').toString().trim().toLowerCase();
          source = nameKey ? nameToStudent.get(nameKey) : undefined;
        }

        // If no direct name match, try normalized name
        if (!source && t.name) {
          const normalizedName = t.name.toString().trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
          if (normalizedName) {
            source = nameToStudent.get(normalizedName);
          }
        }

        if (source?.graduationYear !== selectedYear) return false;
      }
      if (selectedProgramme !== 'all') {
        // Find the student associated with this talk to check their programme
        // First try to match by registration number
        const regKey = (t.registrationNo || '').toString().trim().toLowerCase();
        let source = regKey ? regToStudent.get(regKey) : undefined;

        // If no direct match, try normalized registration number
        if (!source && regKey) {
          const normalizedReg = regKey.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
          if (normalizedReg) {
            source = regToStudent.get(normalizedReg) || regToStudent.get(normalizedReg.toLowerCase());
          }
        }

        // If no match by registration number, try to match by name
        if (!source) {
          const nameKey = (t.name || '').toString().trim().toLowerCase();
          source = nameKey ? nameToStudent.get(nameKey) : undefined;
        }

        // If no direct name match, try normalized name
        if (!source && t.name) {
          const normalizedName = t.name.toString().trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
          if (normalizedName) {
            source = nameToStudent.get(normalizedName);
          }
        }

        if (source?.programme !== selectedProgramme) return false;
      }
      if (term) {
        const hay = `${t.name} ${t.school} ${t.department} ${t.registrationNo || ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    // Sort filtered talks from latest to oldest
    const parseDate = (d: string) => {
      // supports DD/MM/YYYY
      const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        const year = parseInt(m[3], 10);
        return new Date(year, month, day).getTime();
      }
      const t = Date.parse(d);
      return isNaN(t) ? 0 : t;
    };

    return filtered.sort((a, b) => {
      const ta = parseDate(a.date);
      const tb = parseDate(b.date);
      // Descending order - latest first
      return tb - ta;
    });
  }, [talks, searchTerm, selectedSchool, selectedDepartment, selectedYear, selectedProgramme, regToStudent, nameToStudent]);

  // Get school color for consistent branding
  const getSchoolColor = (school: string) => {
    switch (school?.toUpperCase()) {
      case 'SOET': return 'school-engineering';
      case 'SOPAHS': return 'school-paramedical';
      case 'SOM': return 'school-management';
      case 'SOCSA': return 'school-agriculture';
      default: return 'primary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        currentStudent={currentStudent}
        currentDepartmentUser={currentDepartmentUser}
        onLoginClick={() => { router.push('/alumni-directory?login=1'); }}
        onLogout={logout}
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
          <h1 className="text-2xl md:text-3xl font-bold text-center text-primary mb-6">Alumni Talks</h1>

          <TalksFilterSection
            totalCount={talks.length}
            visibleCount={Array.isArray(visibleTalks) ? visibleTalks.length : 0}
            allSchools={allSchools}
            allDepartments={filteredDepartments}
            selectedSchool={selectedSchool}
            selectedDepartment={selectedDepartment}
            searchTerm={searchTerm}
            onSchoolChange={(v) => { setSelectedSchool(v); setSelectedDepartment('all'); }}
            onDepartmentChange={(v) => setSelectedDepartment(v)}
            onSearchChange={(v) => setSearchTerm(v)}
            onClear={() => { setSearchTerm(''); setSelectedSchool('all'); setSelectedDepartment('all'); setSelectedYear('all'); setSelectedProgramme('all'); }}
            // New props for additional filters
            allYears={allYears}
            allProgrammes={allProgrammes}
            selectedYear={selectedYear}
            selectedProgramme={selectedProgramme}
            onYearChange={(v) => setSelectedYear(v)}
            onProgrammeChange={(v) => setSelectedProgramme(v)}
          />

          {isEditor && (
            <div className="mb-8 p-6 border rounded-2xl bg-white/80 shadow-elegant">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">{editingIndex === null ? 'Create Alumni Talk' : 'Edit Alumni Talk'}</h2>
                <button
                  className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                  onClick={() => setShowForm(v => !v)}
                >
                  {showForm ? 'Hide Form' : 'Add Talk'}
                </button>
              </div>
              {showForm && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date</label>
                    <input
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Registration No.</label>
                    <input
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${regNoError ? "border-red-500" : "border-input"
                        }`}
                      placeholder="Registration No."
                      value={registrationNo}
                      onChange={e => handleRegistrationChange(e.target.value)}
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
                      {filteredDepartments.map(d => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Talk Topic</label>
                    <input
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Talk Topic"
                      value={form.talkon}
                      onChange={e => setForm({ ...form, talkon: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Banner Photo</label>
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Banner Photo URL"
                        value={form.bannerPhotoUrl}
                        onChange={e => setForm({ ...form, bannerPhotoUrl: e.target.value })}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Gallery Link</label>
                    <input
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Gallery Link (optional)"
                      value={form.galleryLink}
                      onChange={e => setForm({ ...form, galleryLink: e.target.value })}
                    />
                  </div>
                </div>
              )}
              {showForm && (
                <div className="mt-6 flex gap-3">
                  {editingIndex === null ? (
                    <button
                      className="px-6 py-3 bg-primary text-white rounded-lg font-medium disabled:opacity-70 hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg flex items-center"
                      onClick={onCreate}
                      disabled={saving || uploadingImage || uploadingReport || !!regNoError}
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : 'Create Talk'}
                    </button>
                  ) : (
                    <>
                      <button
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-70 hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center"
                        onClick={onUpdate}
                        disabled={saving || uploadingImage || uploadingReport}
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : 'Update Talk'}
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

          {isLoading && (!visibleTalks || (Array.isArray(visibleTalks) && visibleTalks.length === 0)) ? (
            <div className="space-y-6">
              <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border rounded-xl p-6 bg-white/80 shadow-elegant">
                    <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-4" />
                    <div className="h-5 w-64 bg-gray-200 animate-pulse rounded mb-6" />
                    <div className="h-48 w-full bg-gray-200 animate-pulse rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Array.isArray(visibleTalks) && visibleTalks.length > 0 ? (
                  visibleTalks.map((t, idx) => (
                    <div
                      key={`${t.name}-${t.date}-${idx}`}
                      className="border rounded-xl bg-white shadow-elegant overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                      onClick={() => router.push(`/alumni-talks/${encodeURIComponent(t.name)}-${encodeURIComponent(t.date)}`)}
                    >
                      {/* Banner Only - 1080x1350 aspect ratio */}
                      <div className="relative bg-black w-full" style={{ aspectRatio: '1080/1350' }}>
                        {t.bannerPhotoUrl ? (
                          <img
                            src={getDirectImageUrlSized(t.bannerPhotoUrl, 1080, 1350, 'c')}
                            alt={t.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                          </div>
                        )}

                        {/* Edit button overlay at top for admin users */}
                        {isEditor && (
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              className="px-3 py-1.5 text-sm bg-white/95 backdrop-blur-sm text-blue-600 rounded-lg font-medium hover:bg-white transition-all shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Find the actual index in the original talks array
                                const actualIndex = talks.findIndex(talk =>
                                  talk.name === t.name &&
                                  talk.date === t.date &&
                                  talk.school === t.school
                                );
                                if (actualIndex !== -1) {
                                  onEdit(actualIndex);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                className="px-3 py-1.5 text-sm bg-white/95 backdrop-blur-sm text-red-600 rounded-lg font-medium hover:bg-white transition-all shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to delete the talk by ${t.name}?`)) {
                                    // Find the actual index in the original talks array
                                    const actualIndex = talks.findIndex(talk =>
                                      talk.name === t.name &&
                                      talk.date === t.date &&
                                      talk.school === t.school
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
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      {Array.isArray(visibleTalks) && visibleTalks.length === 0
                        ? "No alumni talks found matching your search criteria."
                        : "No alumni talks available at the moment."}
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

export default AlumniTalks;
