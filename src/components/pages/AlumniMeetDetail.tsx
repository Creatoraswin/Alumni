"use client";

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchAlumniMeets, AlumniMeetItem, Student, getDirectImageUrlSized } from '@/services/apiService';
import { useAuth } from '@/contexts/useAuth';
import UniversalNav from '@/components/UniversalNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AlumniMeetDetail: React.FC = () => {
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout, students } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetId = searchParams.get('id') || '';

  const { data: meets = [], isLoading } = useQuery({
    queryKey: ['alumniMeets'],
    queryFn: fetchAlumniMeets,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const meet = useMemo(() => {
    if (!meetId || isLoading) return null;

    try {
      const decodedId = decodeURIComponent(meetId);
      const lastDashIndex = decodedId.lastIndexOf('-');
      if (lastDashIndex === -1) return null;

      const placeString = decodeURIComponent(decodedId.substring(0, lastDashIndex));
      const dateString = decodeURIComponent(decodedId.substring(lastDashIndex + 1));

      return (meets as AlumniMeetItem[]).find(m =>
        (m.place || 'event') === placeString && m.date === dateString
      ) || null;
    } catch (e) {
      console.error('Error decoding meetId:', e);
      return null;
    }
  }, [meetId, meets, isLoading]);


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

  if (!meet) {
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
              <h2 className="text-2xl font-bold text-foreground mb-4">Meet Not Found</h2>
              <p className="text-muted-foreground mb-6">The alumni meet you're looking for doesn't exist or has been removed.</p>
              <Button
                onClick={() => router.push('/alumni-meets')}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Back to Alumni Meets
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }


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
          <div className="bg-white/80 rounded-2xl shadow-elegant overflow-hidden p-6 md:p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative w-full aspect-[4/3] md:aspect-auto md:h-[500px] bg-slate-50 rounded-xl overflow-hidden p-2 flex items-center justify-center">
                {meet.bannerPhotoUrl ? (
                  <img
                    src={getDirectImageUrlSized(meet.bannerPhotoUrl, 1080, 1350, 'p')}
                    alt={meet.place}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded-xl">
                    <span className="text-gray-500 text-lg">No Banner Image</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">{meet.place}</h1>
                  <p className="text-xl text-muted-foreground">{meet.date}</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Event Report</h3>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{meet.report || "No report available."}</p>
                  </div>

                  {meet.galleryLink && (
                    <a
                      href={meet.galleryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg group"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      View Photo Gallery
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlumniMeetDetail;
