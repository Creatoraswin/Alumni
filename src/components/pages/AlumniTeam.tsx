"use client";

import React, { useState, useEffect } from 'react';
import {
  fetchAlumniTeam, fetchStudentCoordinators,
  AlumniTeamMember, StudentCoordinatorItem,
  getDirectImageUrl
} from '@/services/apiService';
import { useAuth } from '@/contexts/useAuth';
import UniversalNav from '@/components/UniversalNav';
import { useQuery } from '@tanstack/react-query';
import { Users, Award, X, ChevronRight, Building2, BookOpen, IdCard } from 'lucide-react';

// ─── Avatar helper ───────────────────────────────────────────────────────────
function MemberAvatar({ url, name, size = 96 }: { url: string; name: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const resolved = getDirectImageUrl(url);
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  if (!resolved || errored) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-red-500 to-rose-700 flex-shrink-0"
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

// ─── Team Member Card ─────────────────────────────────────────────────────────
function TeamCard({ member, onClick }: { member: AlumniTeamMember; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col items-center text-center border border-gray-100 overflow-hidden w-full"
      aria-label={`View details for ${member.name}`}
    >
      {/* Gradient accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Photo */}
      <div className="mb-4 relative">
        <MemberAvatar url={member.photoUrl} name={member.name} size={96} />
        <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
          <Award className="w-3.5 h-3.5 text-white" />
        </span>
      </div>

      {/* Name */}
      <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight line-clamp-2">{member.name}</h3>

      {/* Designation */}
      {member.designation && (
        <span className="inline-block text-xs font-semibold text-red-600 bg-red-50 rounded-full px-3 py-0.5 mb-3">
          {member.designation}
        </span>
      )}

      {/* Meta */}
      <div className="space-y-1 text-xs text-gray-500 w-full">
        {member.school && (
          <div className="flex items-center justify-center gap-1">
            <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{member.school}</span>
          </div>
        )}
        {member.branch && (
          <div className="flex items-center justify-center gap-1">
            <BookOpen className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{member.branch}</span>
          </div>
        )}
      </div>

      {/* Read more hint */}
      <div className="mt-3 flex items-center gap-1 text-xs text-red-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span>View profile</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </button>
  );
}

// ─── Coordinator Card ─────────────────────────────────────────────────────────
function CoordCard({ coord }: { coord: StudentCoordinatorItem }) {
  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col items-center text-center border border-gray-100 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="mb-4">
        <MemberAvatar url={coord.photoUrl} name={coord.name} size={88} />
      </div>

      <h3 className="text-base font-bold text-gray-900 mb-3 leading-tight line-clamp-2">{coord.name}</h3>

      <div className="space-y-1.5 text-xs text-gray-500 w-full">
        {coord.registrationNo && (
          <div className="flex items-center justify-center gap-1.5">
            <IdCard className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="font-mono font-medium text-gray-700">{coord.registrationNo}</span>
          </div>
        )}
        {coord.school && (
          <div className="flex items-center justify-center gap-1">
            <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{coord.school}</span>
          </div>
        )}
        {coord.branch && (
          <div className="flex items-center justify-center gap-1">
            <BookOpen className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{coord.branch}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function MemberModal({ member, onClose }: { member: AlumniTeamMember; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="h-28 bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 rounded-t-3xl" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Avatar */}
        <div className="flex justify-center -mt-12 px-6">
          <MemberAvatar url={member.photoUrl} name={member.name} size={96} />
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h2>
          {member.designation && (
            <span className="inline-block text-sm font-semibold text-red-600 bg-red-50 rounded-full px-4 py-1 mb-4">
              {member.designation}
            </span>
          )}

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {member.school && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 rounded-full px-3 py-1.5">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>{member.school}</span>
              </div>
            )}
            {member.branch && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 rounded-full px-3 py-1.5">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span>{member.branch}</span>
              </div>
            )}
          </div>

          {member.writeup && (
            <div className="text-left">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{member.writeup}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center animate-pulse border border-gray-100">
      <div className="w-24 h-24 rounded-full bg-gray-200 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AlumniTeamPage: React.FC = () => {
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'team' | 'coordinators'>('team');
  const [selectedMember, setSelectedMember] = useState<AlumniTeamMember | null>(null);

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['alumniTeam'],
    queryFn: fetchAlumniTeam,
    staleTime: 1000 * 60 * 5,
  });

  const { data: coordinators = [], isLoading: coordLoading } = useQuery({
    queryKey: ['studentCoordinators'],
    queryFn: fetchStudentCoordinators,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = activeTab === 'team' ? teamLoading : coordLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
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
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
          <Users className="w-4 h-4" />
          Alumni Association
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Alumni <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600">Team</span>
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-base md:text-lg">
          Meet the dedicated individuals who make the CUTMAP Alumni Association thrive.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex justify-center mb-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1 flex gap-1">
          <button
            id="alumni-team-tab"
            onClick={() => setActiveTab('team')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'team'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Team
            </span>
          </button>
          <button
            id="student-coordinators-tab"
            onClick={() => setActiveTab('coordinators')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'coordinators'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Student Coordinators
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : activeTab === 'team' ? (
          teamMembers.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No team members yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {teamMembers.map(member => (
                <TeamCard key={member.id} member={member} onClick={() => setSelectedMember(member)} />
              ))}
            </div>
          )
        ) : (
          coordinators.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No student coordinators yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {coordinators.map(coord => (
                <CoordCard key={coord.id} coord={coord} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Detail Modal */}
      {selectedMember && (
        <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  );
};

export default AlumniTeamPage;
