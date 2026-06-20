"use client";

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchAlumniTalks, Student, getDirectImageUrlSized, parseGalleryImages } from '@/services/apiService';
import { useAuth } from '@/contexts/useAuth';
import UniversalNav from '@/components/UniversalNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AlumniTalkDetail: React.FC = () => {
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout, students } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const talkId = searchParams.get('id') || '';

  const { data: talks = [], isLoading } = useQuery({
    queryKey: ['alumniTalks'],
    queryFn: fetchAlumniTalks,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Find the specific talk by name and date
  const talk = useMemo(() => {
    if (!talkId || isLoading) return null;

    // Decode the talkId to get name and date
    try {
      const decodedId = decodeURIComponent(talkId);
      const lastDashIndex = decodedId.lastIndexOf('-');
      if (lastDashIndex === -1) return null;

      const nameString = decodedId.substring(0, lastDashIndex);
      const dateString = decodedId.substring(lastDashIndex + 1);

      return talks.find(t =>
        t.name === nameString && t.date === dateString
      );
    } catch (e) {
      console.error('Error decoding talkId:', e);
      return null;
    }
  }, [talkId, talks, isLoading]);

  // Parse gallery images from the gallery link (moved to avoid conditional hook error)
  const galleryImages = useMemo(() => {
    if (!talk || isLoading) return [];
    const parsed = parseGalleryImages(talk.galleryLink || '');
    return parsed;
  }, [talk, isLoading]);

  // Fast lookup maps for programme/year resolution with enhanced matching
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

  if (isLoading) {
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
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!talk) {
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
        <div className="w-full px-4 md:px-6 lg:px-8 py-6 pt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">Talk Not Found</h2>
              <p className="text-muted-foreground mb-6">The alumni talk you're looking for doesn't exist or has been removed.</p>
              <Button
                onClick={() => router.push('/alumni-talks')}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Back to Alumni Talks
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get student details
  // First try to match by registration number
  const regKey = (talk.registrationNo || '').toString().trim().toLowerCase();
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
    const nameKey = (talk.name || '').toString().trim().toLowerCase();
    source = nameKey ? nameToStudent.get(nameKey) : undefined;
  }

  // If no direct name match, try normalized name
  if (!source && talk.name) {
    const normalizedName = talk.name.toString().trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    if (normalizedName) {
      source = nameToStudent.get(normalizedName);
    }
  }

  const programme = source?.programme || '-';
  const graduationYear = source?.graduationYear || '-';
  const regDisplay = (talk.registrationNo && String(talk.registrationNo).trim()) || (source?.registrationNo && String(source.registrationNo).trim()) || '-';

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
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => router.push('/alumni-talks')}
            variant="outline"
            className="mb-6 flex items-center gap-2 border-primary/30 hover:gradient-accent hover:text-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Alumni Talks
          </Button>

          {/* Three Column Layout: Banner | Talk Info | Alumni Info */}
          <div className="bg-white/80 rounded-2xl shadow-elegant overflow-hidden p-6 md:p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Column 1: Banner with Overlay (33%) */}
              <div className="lg:col-span-4">
                <div className="relative w-full h-full bg-slate-50 rounded-xl overflow-hidden p-2 flex items-center justify-center" style={{ minHeight: '500px', aspectRatio: '1080/1350' }}>
                  {talk.bannerPhotoUrl ? (
                    <>
                      <img
                        src={getDirectImageUrlSized(talk.bannerPhotoUrl, 1080, 1350, 'p')}
                        alt={talk.name}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                      />
                      {/* Overlay gradient with key information */}
                      <div className="absolute inset-x-2 bottom-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 md:p-6 rounded-b-lg">
                        <div className="text-white">
                          <h1 className="text-xl md:text-2xl font-bold mb-2">{talk.name}</h1>
                          <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{talk.date}</span>
                            </div>
                            <span className="text-white/60">•</span>
                            <span className="text-sm">{talk.school}</span>
                          </div>
                          {talk.talkon && (
                            <p className="text-xs md:text-sm text-white/90 italic line-clamp-2">"{talk.talkon}"</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded-xl">
                      <span className="text-gray-500 text-lg">No Banner Image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Talk Information (33%) */}
              <div className="lg:col-span-4">
                <div className="h-full flex flex-col">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Talk Information
                  </h2>
                  <div className="space-y-3 flex-1">
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Date of the Event</span>
                      <span className="font-semibold text-foreground">{talk.date}</span>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Talk Topic</span>
                      <span className="font-semibold text-foreground">{talk.talkon || '-'}</span>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">School</span>
                      <span className="font-semibold text-foreground">{talk.school}</span>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Department</span>
                      <span className="font-semibold text-foreground">{talk.department}</span>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Registration No.</span>
                      <span className="font-semibold text-foreground">{regDisplay}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Alumni Information (33%) */}
              <div className="lg:col-span-4">
                <div className="h-full flex flex-col">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Alumni Info
                  </h2>
                  <div className="space-y-3 flex-1">
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Full Name</span>
                      <span className="font-semibold text-foreground">{talk.name}</span>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Programme</span>
                      <span className="font-semibold text-foreground">{programme}</span>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Graduation Year</span>
                      <span className="font-semibold text-foreground">{graduationYear}</span>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Current Position</span>
                      <span className="font-semibold text-foreground">{source?.designation || '-'}</span>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Organization</span>
                      <span className="font-semibold text-foreground">{source?.organisation || '-'}</span>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <span className="text-muted-foreground text-sm block mb-1">Location</span>
                      <span className="font-semibold text-foreground">{source?.location || '-'}</span>
                    </div>
                    <div className="pb-3">
                      <span className="text-muted-foreground text-sm block mb-1">Area of Interest</span>
                      <span className="font-semibold text-foreground">{source?.areaOfInterest || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          {(() => {
            console.log('Gallery render check:', {
              galleryLink: talk.galleryLink,
              galleryLinkLength: talk.galleryLink?.length,
              galleryImagesLength: galleryImages.length,
              galleryImages: galleryImages
            });
            return talk.galleryLink && galleryImages.length > 0 && (
              <div className="bg-white/80 rounded-2xl shadow-elegant p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Event Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {galleryImages.slice(0, 6).map((imageUrl, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer">
                      <img
                        src={getDirectImageUrlSized(imageUrl, 300, 300, 'c')}
                        alt={`Gallery image ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          console.log('Gallery image failed to load:', imageUrl);
                          // Hide broken images
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Gallery image loaded successfully:', imageUrl);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <a
                    href={talk.galleryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline text-sm"
                  >
                    View Full Gallery ({galleryImages.length} images) →
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default AlumniTalkDetail;