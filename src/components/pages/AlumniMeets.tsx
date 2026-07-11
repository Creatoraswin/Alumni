"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { fetchAlumniMeets, createAlumniMeet, updateAlumniMeet, deleteAlumniMeet, AlumniMeetItem, uploadImageToDrive, getDirectImageUrlSized, Student } from '@/services/apiService';
import TalksFilterSection from '@/components/TalksFilterSection';
import { useAuth } from '@/contexts/useAuth';
import UniversalNav from '@/components/UniversalNav';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';

const AlumniMeets: React.FC = () => {
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout } = useAuth();
  const router = useRouter();
  const isEditor = isLoggedIn && (userRole === 'admin' || userRole === 'alumni-manager');
  const isAdmin = isLoggedIn && userRole === 'admin';

  const queryClient = useQueryClient();
  const { data: meets = [], isLoading, isFetching } = useQuery({
    queryKey: ['alumniMeets'],
    queryFn: fetchAlumniMeets,
    staleTime: 1000 * 60 * 5, // 5 minutes for fresh data
    gcTime: 1000 * 60 * 30, // 30 minutes for cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<AlumniMeetItem>({ date: '', place: '', bannerPhotoUrl: '', galleryLink: '', report: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { students } = useAuth();


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToDrive(file);
      setForm(prev => ({ ...prev, bannerPhotoUrl: url }));
    } finally { setUploadingImage(false); }
  };

  const resetForm = () => {
    setForm({ date: '', place: '', bannerPhotoUrl: '', galleryLink: '', report: '' });
  };

  const onCreate = async () => {
    if (uploadingImage) return;
    setSaving(true);
    try {
      await createAlumniMeet(form);
      resetForm();
      const next = await fetchAlumniMeets();
      queryClient.setQueryData(['alumniMeets'], next);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const onEdit = (idx: number) => {
    setEditingIndex(idx);
    setForm(visibleMeets[idx]);
    setShowForm(true);
  };

  const onUpdate = async () => {
    if (editingIndex === null) return;
    if (uploadingImage) return;
    setSaving(true);
    try {
      const target = visibleMeets[editingIndex];
      await updateAlumniMeet({ rowIndex: target.rowIndex, date: target.date, place: target.place }, form);
      setEditingIndex(null);
      resetForm();
      setShowForm(false);
      const next = await fetchAlumniMeets();
      queryClient.setQueryData(['alumniMeets'], next);
    } finally { setSaving(false); }
  };

  const onDelete = async (idx: number) => {
    const target = visibleMeets[idx];
    if (!target) return;
    if (!window.confirm("Are you sure you want to delete this meet?")) return;
    setSaving(true);
    try {
      await deleteAlumniMeet({ rowIndex: target.rowIndex, date: target.date, place: target.place });
      const next = await fetchAlumniMeets();
      queryClient.setQueryData(['alumniMeets'], next);
    } finally { setSaving(false); }
  };

  const visibleMeets = useMemo(() => {
    if (!Array.isArray(meets)) return [];

    const term = searchTerm.trim().toLowerCase();
    const filtered = meets.filter(m => {
      if (term) {
        const hay = `${m.place} ${m.report} ${m.date}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    const parseDate = (d: string) => {
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
      return tb - ta;
    });
  }, [meets, searchTerm]);




  return (
    <>
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        currentStudent={currentStudent}
        currentDepartmentUser={currentDepartmentUser}
        onLoginClick={() => { router.push('/alumni-directory?login=1'); }}
        onLogout={logout}
      />
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-primary mb-6">Alumni Meets</h1>

          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by date, place, or report..."
              className="flex-1 p-3 border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isEditor && (
            <div className="mb-8 p-6 border rounded-2xl bg-white/80 shadow-elegant">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">{editingIndex === null ? 'Create Alumni Meet' : 'Edit Alumni Meet'}</h2>
                <button
                  className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                  onClick={() => setShowForm(v => !v)}
                >
                  {showForm ? 'Hide Form' : 'Add Meet'}
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
                    <label className="text-sm font-medium text-foreground">Place of the Event</label>
                    <input
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Event Location"
                      value={form.place}
                      onChange={e => setForm({ ...form, place: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Gallery Link</label>
                    <input
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Photos Gallery URL"
                      value={form.galleryLink}
                      onChange={e => setForm({ ...form, galleryLink: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Report</label>
                    <textarea
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Event Summary / Report"
                      rows={3}
                      value={form.report}
                      onChange={e => setForm({ ...form, report: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
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
                </div>
              )}
              {showForm && (
                <div className="mt-6 flex gap-3">
                  {editingIndex === null ? (
                    <button
                      className="px-6 py-3 bg-primary text-white rounded-lg font-medium disabled:opacity-70 hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg flex items-center"
                      onClick={onCreate}
                      disabled={saving || uploadingImage}
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : 'Create Meet'}
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
                        ) : 'Update Meet'}
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

          {isLoading && (!visibleMeets || (Array.isArray(visibleMeets) && visibleMeets.length === 0)) ? (
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
                {Array.isArray(visibleMeets) && visibleMeets.length > 0 ? (
                  visibleMeets.map((m, idx) => (
                    <div
                      key={`${m.place}-${m.date}-${idx}`}
                      className="border rounded-xl bg-white shadow-elegant overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                      onClick={() => router.push(`/alumni-meets/detail?id=${encodeURIComponent(m.place || 'event')}-${encodeURIComponent(m.date)}`)}
                    >
                      <div className="relative bg-black w-full" style={{ aspectRatio: '1080/1350' }}>
                        {m.bannerPhotoUrl ? (
                          <img
                            src={getDirectImageUrlSized(m.bannerPhotoUrl, 1080, 1350, 'p')}
                            alt={m.place}
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                          </div>
                        )}

                        {isEditor && (
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              className="px-3 py-1.5 text-sm bg-white/95 backdrop-blur-sm text-blue-600 rounded-lg font-medium hover:bg-white transition-all shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(idx);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                className="px-3 py-1.5 text-sm bg-white/95 backdrop-blur-sm text-red-600 rounded-lg font-medium hover:bg-white transition-all shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(idx);
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
                      {Array.isArray(visibleMeets) && visibleMeets.length === 0
                        ? "No alumni meets found matching your search criteria."
                        : "No alumni meets available at the moment."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AlumniMeets;
