"use client";

import React, { useState } from 'react';
import { fetchStudentAmbassadors, StudentAmbassador, getDirectImageUrl } from '@/services/apiService';
import { useAuth } from '@/contexts/useAuth';
import UniversalNav from '@/components/UniversalNav';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Phone, Linkedin, Instagram, Building2, BookOpen, Search, X
} from 'lucide-react';

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ url, name, size = 96 }: { url: string; name: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const resolved = getDirectImageUrl(url);
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  if (!resolved || errored) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex-shrink-0 select-none"
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover flex-shrink-0 ring-4 ring-white shadow-lg"
      onError={() => setErrored(true)}
    />
  );
}

// ─── Ambassador Card ──────────────────────────────────────────────────────────
function AmbassadorCard({ amb }: { amb: StudentAmbassador }) {
  const hasSocial = amb.linkedinId || amb.instagramId || amb.phone;

  return (
    <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden flex flex-col">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Card body */}
      <div className="p-6 flex flex-col items-center text-center flex-1">
        {/* Photo */}
        <div className="mb-4">
          <Avatar url={amb.photoUrl} name={amb.name} size={88} />
        </div>

        {/* Name */}
        <h3 className="text-base font-bold text-gray-900 mb-3 leading-snug line-clamp-2">{amb.name}</h3>

        {/* School / Department */}
        <div className="space-y-1 text-xs text-gray-500 mb-4 w-full">
          {amb.school && (
            <div className="flex items-center justify-center gap-1.5">
              <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="line-clamp-1">{amb.school}</span>
            </div>
          )}
          {amb.department && (
            <div className="flex items-center justify-center gap-1.5">
              <BookOpen className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="line-clamp-1">{amb.department}</span>
            </div>
          )}
        </div>

        {/* Social / Contact links */}
        {hasSocial && (
          <div className="flex items-center justify-center gap-2 flex-wrap mt-auto pt-2 border-t border-gray-100 w-full">
            {amb.phone && (
              <a
                href={`tel:${amb.phone}`}
                title={`Call ${amb.name}`}
                className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-full px-3 py-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}
            {amb.linkedinId && (
              <a
                href={amb.linkedinId.startsWith('http') ? amb.linkedinId : `https://linkedin.com/in/${amb.linkedinId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-full px-3 py-1.5 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
            )}
            {amb.instagramId && (
              <a
                href={amb.instagramId.startsWith('http') ? amb.instagramId : `https://instagram.com/${amb.instagramId.replace('@','')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-pink-50 hover:text-pink-700 rounded-full px-3 py-1.5 transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col items-center animate-pulse">
      <div className="w-22 h-22 rounded-full bg-gray-200 mb-4" style={{ width: 88, height: 88 }} />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="h-8 bg-gray-100 rounded-full w-full mt-auto" />
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
const StudentAmbassadorPage: React.FC = () => {
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout } = useAuth();
  const [search, setSearch] = useState('');

  const { data: ambassadors = [], isLoading } = useQuery({
    queryKey: ['studentAmbassadors'],
    queryFn: fetchStudentAmbassadors,
    staleTime: 1000 * 60 * 5,
  });

  const filtered = ambassadors.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.school.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q)
    );
  });

  // Unique schools for filter pills
  const schools = [...new Set(ambassadors.map(a => a.school).filter(Boolean))].sort();
  const [activeSchool, setActiveSchool] = useState('');

  const displayed = activeSchool
    ? filtered.filter(a => a.school === activeSchool)
    : filtered;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        currentStudent={currentStudent}
        currentDepartmentUser={currentDepartmentUser}
        onLoginClick={() => {}}
        onLogout={logout}
      />

      {/* Hero */}
      <div className="pt-24 pb-10 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
          <Users className="w-4 h-4" />
          CUTMAP Alumni Association
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Student{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-600">
            Ambassadors
          </span>
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-base md:text-lg">
          Connect with our student ambassadors — they're here to guide, inspire, and support you.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="max-w-5xl mx-auto px-4 mb-8 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="ambassador-search"
            type="text"
            placeholder="Search by name, school or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* School filter pills */}
        {schools.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveSchool('')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeSchool === ''
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              All Schools
            </button>
            {schools.map(school => (
              <button
                key={school}
                onClick={() => setActiveSchool(school === activeSchool ? '' : school)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeSchool === school
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
                }`}
              >
                {school}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {search || activeSchool ? 'No ambassadors match your search' : 'No ambassadors yet'}
            </p>
            {(search || activeSchool) && (
              <button
                onClick={() => { setSearch(''); setActiveSchool(''); }}
                className="mt-3 text-sm text-violet-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 text-center mb-6">
              {displayed.length} ambassador{displayed.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {displayed.map(amb => (
                <AmbassadorCard key={amb.id} amb={amb} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentAmbassadorPage;
