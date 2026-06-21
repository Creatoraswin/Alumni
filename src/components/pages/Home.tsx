"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Student, fetchStudentsData, fetchAlumniTalks, AlumniTalkItem, AlumniSpotlightItem, fetchAlumniSpotlight, fetchAlumniMeets, AlumniMeetItem } from "@/services/apiService";
import { useAuth } from "@/contexts/useAuth";
import UniversalNav from "@/components/UniversalNav";
import VideoPlayer from "@/components/VideoPlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Star, Building2, GraduationCap, TrendingUp, Users, ArrowRight, Youtube, Award, Phone, Mail, Linkedin, Globe, ChevronRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import { dataCache } from "@/services/dataCache";
import AuthModal from "@/components/AuthModal";

const Home = () => {
  const router = useRouter();
  const {
    isLoggedIn,
    userRole,
    currentStudent,
    currentDepartmentUser,
    logout,
    login,
    students: cachedStudents,
    loading: globalLoading,
    dataLoaded
  } = useAuth();

  // Check if user is admin
  const isAdmin = userRole === "admin" || userRole === "cadmin";

  // State declarations
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [companies, setCompanies] = useState<{ name: string; logo: string; count: number }[]>([]);
  const [universities, setUniversities] = useState<{ name: string; count: number }[]>([]);
  const [alumniTalks, setAlumniTalks] = useState<AlumniTalkItem[]>([]);
  const [alumniSpotlights, setAlumniSpotlights] = useState<AlumniSpotlightItem[]>([]);
  const [talksLoading, setTalksLoading] = useState(true);
  const [spotlightsLoading, setSpotlightsLoading] = useState(true);
  const [alumniMeets, setAlumniMeets] = useState<AlumniMeetItem[]>([]);
  const [meetsLoading, setMeetsLoading] = useState(true);

  // Function to extract company data from students
  const extractCompanyData = (students: Student[]) => {
    const companyMap = new Map<string, { name: string; logo: string; count: number }>();

    students.forEach(student => {
      // Check if organisation field exists and is valid
      if (student.organisation &&
        student.organisation.trim() !== "" &&
        student.organisation.trim().toUpperCase() !== "NA" &&
        student.organisation.trim().toLowerCase() !== "not specified" &&
        student.organisation.trim() !== "null" &&
        student.organisation.trim() !== "undefined") {
        const org = student.organisation.trim();
        if (companyMap.has(org)) {
          const current = companyMap.get(org)!;
          companyMap.set(org, { ...current, count: current.count + 1 });
        } else {
          // Simple logo assignment based on first letter
          let logo = "🏢";
          const firstChar = org.charAt(0).toUpperCase();
          if (firstChar >= 'A' && firstChar <= 'G') logo = "🏢";
          else if (firstChar >= 'H' && firstChar <= 'M') logo = "💼";
          else if (firstChar >= 'N' && firstChar <= 'S') logo = "🌟";
          else logo = "⚡";

          companyMap.set(org, { name: org, logo, count: 1 });
        }
      }
    });

    // Convert to array and sort by count
    const companyArray = Array.from(companyMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 16); // cap to 16 total

    setCompanies(companyArray);
  };

  // Function to extract university data from higher studies students
  const extractUniversityData = (students: Student[]) => {
    const universityMap = new Map<string, { name: string; count: number }>();

    students.forEach(student => {
      // Check if universityName field exists and is valid
      if (student.universityName &&
        student.universityName.trim() !== "" &&
        student.universityName.trim().toUpperCase() !== "NA" &&
        student.universityName.trim().toLowerCase() !== "not specified" &&
        student.universityName.trim() !== "null" &&
        student.universityName.trim() !== "undefined") {
        const university = student.universityName.trim();
        if (universityMap.has(university)) {
          const current = universityMap.get(university)!;
          universityMap.set(university, { ...current, count: current.count + 1 });
        } else {
          universityMap.set(university, { name: university, count: 1 });
        }
      }
    });

    // Convert to array and sort by count
    const universityArray = Array.from(universityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 16);

    setUniversities(universityArray);
  };

  useEffect(() => {
    const loadFeaturedStudents = async () => {
      try {
        let students: Student[];

        // Check if we have cached data first
        if (dataLoaded && cachedStudents.length > 0) {
          students = cachedStudents;
        } else {
          // Use cache service to get data
          students = await dataCache.getData(() => fetchStudentsData(true));
        }

        // Get approved students with complete information
        const approvedStudents = students.filter(student => student.Status === "Approved");
        const studentsWithBasicInfo = approvedStudents.filter(student => {
          const hasBasicInfo = student.photoUrl &&
            student.photoUrl !== "NA" &&
            student.photoUrl !== "Not specified" &&
            student.name &&
            student.name !== "NA" &&
            student.name !== "Not specified";
          return hasBasicInfo;
        });

        // Extract company data for the "Alumni Work At" section
        extractCompanyData(studentsWithBasicInfo);

        // Extract university data for the "Higher Studies Universities" section
        extractUniversityData(studentsWithBasicInfo);

      } catch (error) {
        console.error('Failed to load featured students:', error);
      }
    };

    loadFeaturedStudents();
  }, [dataLoaded, cachedStudents]);

  // Fetch alumni talks
  useEffect(() => {
    const loadAlumniTalks = async () => {
      try {
        setTalksLoading(true);
        const talks = await fetchAlumniTalks();

        // Get students data for matching
        let students: Student[];

        // Check if we have cached data first
        if (dataLoaded && cachedStudents.length > 0) {
          students = cachedStudents;
        } else {
          // Use cache service to get data
          students = await dataCache.getData(() => fetchStudentsData(true));
        }

        // Create fast lookup maps for matching
        const regToStudent = new Map<string, Student>();
        const nameToStudent = new Map<string, Student>();

        students.forEach(s => {
          const regKey = (s.registrationNo || '').toString().trim().toLowerCase();
          if (regKey) {
            regToStudent.set(regKey, s);

            // Also add alternative keys for better matching
            const normalizedReg = regKey.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
            if (normalizedReg && normalizedReg !== regKey) {
              regToStudent.set(normalizedReg, s);
            }
          }

          const nameKey = (s.name || '').toString().trim().toLowerCase();
          if (nameKey) {
            nameToStudent.set(nameKey, s);

            // Also add alternative keys for better matching
            const normalized = nameKey.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
            if (normalized && normalized !== nameKey) {
              nameToStudent.set(normalized, s);
            }
          }
        });

        // Filter talks to only include those with matching students
        const talksWithMatchingStudents = talks.filter(talk => {
          // First try to match by registration number
          const regKey = (talk.registrationNo || '').toString().trim().toLowerCase();
          let hasMatch = regKey ? regToStudent.has(regKey) : false;

          // If no direct match, try normalized registration number
          if (!hasMatch && regKey) {
            const normalizedReg = regKey.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
            if (normalizedReg) {
              hasMatch = regToStudent.has(normalizedReg) || regToStudent.has(normalizedReg.toLowerCase());
            }
          }

          // If no registration number match, try to match by name
          if (!hasMatch) {
            const nameKey = (talk.name || '').toString().trim().toLowerCase();
            hasMatch = nameKey ? nameToStudent.has(nameKey) : false;
          }

          // If no direct name match, try normalized name
          if (!hasMatch && talk.name) {
            const normalizedName = talk.name.toString().trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
            if (normalizedName) {
              hasMatch = nameToStudent.has(normalizedName);
            }
          }

          return hasMatch;
        });

        // Sort talks by date (latest first)
        const sortedTalks = [...talksWithMatchingStudents].sort((a, b) => {
          // Parse dates in DD/MM/YYYY format
          const parseDate = (dateStr: string) => {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              return new Date(
                parseInt(parts[2], 10),
                parseInt(parts[1], 10) - 1,
                parseInt(parts[0], 10)
              ).getTime();
            }
            return new Date(dateStr).getTime() || 0;
          };

          return parseDate(b.date) - parseDate(a.date);
        });

        // Take only the first 4 talks for the home page
        setAlumniTalks(sortedTalks.slice(0, 4));
      } catch (error) {
        console.error('Failed to load alumni talks:', error);
      } finally {
        setTalksLoading(false);
      }
    };

    loadAlumniTalks();
  }, [dataLoaded, cachedStudents]);

  // Fetch alumni spotlights
  useEffect(() => {
    const loadAlumniSpotlights = async () => {
      try {
        setSpotlightsLoading(true);
        const spotlights = await fetchAlumniSpotlight();

        // Filter spotlights based on user role
        // Admins can see all spotlights, regular users only see approved ones
        const filteredSpotlights = isAdmin
          ? spotlights
          : spotlights.filter(spotlight => {
          const isApproved = spotlight.status === 'Approved';
          return isApproved;
        });

        // Sort spotlights by date (latest first)
        const sortedSpotlights = [...filteredSpotlights].sort((a, b) => {
          // Parse dates in DD/MM/YYYY format
          const parseDate = (dateStr: string) => {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              return new Date(
                parseInt(parts[2], 10),
                parseInt(parts[1], 10) - 1,
                parseInt(parts[0], 10)
              ).getTime();
            }
            return new Date(dateStr).getTime() || 0;
          };

          return parseDate(b.dateAdded) - parseDate(a.dateAdded);
        });

        // Take only the first 5 spotlights for the home page
        const finalSpotlights = sortedSpotlights.slice(0, 5);

        setAlumniSpotlights(finalSpotlights);
      } catch (error) {
        console.error('Failed to load alumni spotlights:', error);
      } finally {
        setSpotlightsLoading(false);
      }
    };

    loadAlumniSpotlights();
  }, [isAdmin]);

  // Fetch alumni meets
  useEffect(() => {
    const loadAlumniMeets = async () => {
      try {
        setMeetsLoading(true);
        const meets = await fetchAlumniMeets();

        // Filter meets to only include upcoming ones (including today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredMeets = meets.filter(meet => {
          if (!meet.date) return false;

          // Parse date in DD/MM/YYYY format
          const parts = meet.date.split('/');
          if (parts.length === 3) {
            const eventDate = new Date(
              parseInt(parts[2], 10),
              parseInt(parts[1], 10) - 1,
              parseInt(parts[0], 10)
            );
            return eventDate >= today;
          }

          // Fallback for other date formats
          const eventDate = new Date(meet.date);
          return !isNaN(eventDate.getTime()) && eventDate >= today;
        });

        // Sort by date (closest first)
        const sortedMeets = [...filteredMeets].sort((a, b) => {
          const parseDate = (dateStr: string) => {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              return new Date(
                parseInt(parts[2], 10),
                parseInt(parts[1], 10) - 1,
                parseInt(parts[0], 10)
              ).getTime();
            }
            return new Date(dateStr).getTime() || 0;
          };
          return parseDate(a.date) - parseDate(b.date);
        });

        setAlumniMeets(sortedMeets);
      } catch (error) {
        console.error('Failed to load alumni meets:', error);
      } finally {
        setMeetsLoading(false);
      }
    };

    loadAlumniMeets();
  }, []);

  const schools = [
    {
      name: "SoET",
      fullName: "School of Engineering & Technology",
      description: "Leading innovation in engineering fields",
      icon: "🔧",
      color: "school-engineering"
    },
    {
      name: "SoPAHS",
      fullName: "School of Paramedical & Allied Health Sciences",
      description: "Excellence in healthcare and medical sciences",
      icon: "🏥",
      color: "school-paramedical"
    },
    {
      name: "SoM",
      fullName: "School of Management",
      description: "Developing future business leaders",
      icon: "💼",
      color: "school-management"
    },
    {
      name: "SoCSAg",
      fullName: "School of Centurion Smart Agriculture",
      description: "Advancing agricultural technology and computer science",
      icon: "🌱",
      color: "school-agriculture"
    }
  ];

  const features = [
    {
      title: "Student-Student Communication",
      description: "Connect with fellow alumni through email and LinkedIn",
      icon: <Users className="h-8 w-8" />,
      channels: ["Email", "LinkedIn"],
      gradient: "bg-[#EFD64E]"
    },
    {
      title: "HoD-Student Communication",
      description: "Head of Department direct communication with alumni",
      icon: <GraduationCap className="h-8 w-8" />,
      channels: ["Phone", "Email", "LinkedIn"],
      gradient: "bg-[#CE332F]"
    },
    {
      title: "Dean-Student Communication",
      description: "Administrative support and guidance from Deans",
      icon: <Award className="h-8 w-8" />,
      channels: ["Phone", "Email", "LinkedIn"],
      gradient: "bg-[#C0934B]"
    },
    {
      title: "Alumni Manager",
      description: "Comprehensive alumni relationship management",
      icon: <TrendingUp className="h-8 w-8" />,
      channels: ["Phone", "Email", "LinkedIn"],
      gradient: "bg-[#CE332F]"
    }
  ];

  // Enhanced Loading component with better messaging
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="relative">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mb-6"></div>
          <div className="absolute inset-0 inline-block animate-ping rounded-full h-16 w-16 border-4 border-primary/30"></div>
        </div>
        <h3 className="text-xl font-bold text-primary mb-2 sm:mb-3">Loading Alumni Network</h3>
        <p className="text-muted-foreground text-lg">
          Fetching the latest alumni data...
        </p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );

  // Skeleton loading for cards
  const CardSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-muted rounded-2xl p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-muted-foreground/20 rounded-xl"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
            <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted-foreground/20 rounded w-full"></div>
          <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar - Replaced custom nav with UniversalNav for consistency */}
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={isLoggedIn ? userRole : null}
        currentStudent={isLoggedIn && userRole === "student" ? currentStudent : null}
        currentDepartmentUser={isLoggedIn && (userRole === "department" || userRole === "school") ? currentDepartmentUser : null}
        onLogout={() => {
          if (isLoggedIn) {
            logout();
          }
        }}
        onLoginClick={() => setIsAuthModalOpen(true)}
      />
      {/* Hero Section - Mobile Design */}
      <section className="relative overflow-hidden mt-14 sm:hidden">
        {/* Mobile Hero */}
        <div
          className="relative"
          style={{
            backgroundImage: "url(/Alumni_banner.svg)",
            backgroundSize: "contain",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            minHeight: "180px",
            height: "5vh"
          }}
          onLoad={() => setBannerLoaded(true)}
        >
          <div className="absolute inset-0 bg-black/5"></div>
        </div>
        {/* Mobile Buttons Below Image */}
        <div className="px-3 py-3 bg-background">
          <div className="flex flex-row gap-2 justify-center">
            <Button
              size="sm"
              onClick={() => router.push('/alumni-directory')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-3 py-2 text-xs shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg group flex-1"
            >
              <Users className="mr-1 h-3 w-3 group-hover:scale-110 transition-transform" />
              <span>Explore Network</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/SignUp')}
              className="border-2 border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold px-3 py-2 text-xs transition-all duration-300 transform hover:scale-105 rounded-lg group flex-1"
            >
              <span>Join Network</span>
              <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
      {/* Hero Section - Tablet Design */}
      <section className="relative overflow-hidden mt-16 hidden sm:block md:hidden">
        {/* Tablet Hero */}
        <div
          className="relative"
          style={{
            backgroundImage: "url(/Alumni_banner.svg)",
            backgroundSize: "contain",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            minHeight: "250px",
            height: "35vh"
          }}
          onLoad={() => setBannerLoaded(true)}
        >
          <div className="absolute inset-0 bg-black/5"></div>
        </div>
        {/* Tablet Buttons Below Image */}
        <div className="px-4 py-4 bg-background">
          <div className="flex flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/alumni-directory')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-3 text-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl group flex-1"
            >
              <Users className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Explore Network</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/SignUp')}
              className="border-2 border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold px-5 py-3 text-sm transition-all duration-300 transform hover:scale-105 rounded-xl group flex-1"
            >
              <span>Join Network</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
      {/* Hero Section - Desktop Design */}
      <section className="relative overflow-hidden mt-16 hidden md:block">
        <div
          className="relative"
          style={{
            backgroundImage: "url(/Alumni_banner.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            minHeight: "500px",
            height: "80vh"
          }}
          onLoad={() => setBannerLoaded(true)}
        >
          <div className="absolute inset-0 bg-transparent"></div>
          <div className="absolute bottom-16 left-8 z-10">
            <div className="flex flex-row gap-6 justify-start items-center">
              <Button
                size="lg"
                onClick={() => router.push('/alumni-directory')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl group"
              >
                <Users className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>Explore Network</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/SignUp')}
                className="border-2 border-primary bg-primary/10 text-primary hover:bg-primary hover:text-white backdrop-blur-sm font-bold px-8 py-4 text-lg transition-all duration-300 transform hover:scale-105 rounded-xl group"
              >
                <span>Join Network</span>
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Alumni Students Section - Updated color scheme */}
      <section className="py-4 sm:py-6 bg-muted/30">
        {/* Alumni Meet Section - Only display if there are upcoming meets */}
        {alumniMeets.length > 0 || meetsLoading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-primary mr-2" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">Alumni Meets</h2>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/alumni-meets')}
                className="hidden sm:flex items-center text-primary border-primary hover:bg-primary hover:text-white"
              >
                View All Meets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/alumni-meets')}
                className="sm:hidden text-primary border-primary hover:bg-primary hover:text-white"
              >
                View All
              </Button>
            </div>

            {meetsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="flex flex-col sm:flex-row border rounded-2xl bg-white shadow-sm overflow-hidden animate-pulse min-h-[280px]">
                    <div className="w-full sm:w-2/5 bg-gray-200"></div>
                    <div className="w-full sm:w-3/5 p-6 space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {alumniMeets.slice(0, 4).map((meet, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row border rounded-2xl bg-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-300"
                    onClick={() => router.push(`/alumni-meets/detail?id=${encodeURIComponent(meet.place || 'event')}-${encodeURIComponent(meet.date)}`)}
                  >
                    {/* Banner Photo Section - Left Side */}
                    <div className="w-full sm:w-2/5 aspect-[4/3] sm:aspect-auto bg-slate-50 flex items-center justify-center overflow-hidden min-h-[280px] p-1">
                      {meet.bannerPhotoUrl ? (
                        <img
                          src={meet.bannerPhotoUrl}
                          alt={meet.place}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            const url = img.src;
                            if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
                              const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                              if (match && match[1]) {
                                // Use =s0 for original size/non-cropped image
                                img.src = `https://lh3.googleusercontent.com/d/${match[1]}=s0`;
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-8">
                          <Users className="h-10 w-10 mb-2 opacity-20" />
                          <span className="text-xs">No Banner</span>
                        </div>
                      )}
                    </div>

                    {/* Details Section - Right Side */}
                    <div className="w-full sm:w-3/5 p-6 flex flex-col justify-center">
                      <div className="mb-3">
                        <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-none font-semibold px-2">
                          Upcoming Event
                        </Badge>
                        <h3 className="text-xl font-bold text-slate-900 line-clamp-2 leading-tight">
                          {meet.place}
                        </h3>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-slate-600">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <span className="text-sm font-medium">{meet.date}</span>
                        </div>
                        <div className="flex items-center text-slate-600">
                          <Building2 className="h-4 w-4 mr-2 text-primary" />
                          <span className="text-sm line-clamp-1">{meet.place}</span>
                        </div>
                      </div>

                      <div className="pt-2 mt-auto border-t border-slate-100">
                         <Button variant="link" className="p-0 h-auto text-primary font-bold flex items-center group">
                           View Meet Details
                           <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                         </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Alumni Talks Section - Added above Featured Alumni */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">Alumni Talks</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/alumni-talks')}
              className="hidden sm:flex items-center text-primary border-primary hover:bg-primary hover:text-white"
            >
              View All Talks
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/alumni-talks')}
              className="sm:hidden text-primary border-primary hover:bg-primary hover:text-white"
            >
              View All
            </Button>
          </div>

          {talksLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="border rounded-xl bg-white shadow-elegant overflow-hidden animate-pulse">
                  <div className="w-full bg-gray-200" style={{ aspectRatio: '1080/1350' }}></div>
                </div>
              ))}
            </div>
          ) : alumniTalks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {alumniTalks.map((talk, index) => (
                <div
                  key={index}
                  className="border rounded-xl bg-white shadow-elegant overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => router.push(`/alumni-talks/detail?id=${encodeURIComponent(talk.name)}-${encodeURIComponent(talk.date)}`)}
                >
                  {/* Banner Only - 1080x1350 aspect ratio */}
                  <div className="relative bg-black w-full" style={{ aspectRatio: '1080/1350' }}>
                    {talk.bannerPhotoUrl ? (
                      <img
                        src={talk.bannerPhotoUrl}
                        alt={talk.name}
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
                                `https://lh3.googleusercontent.com/d/${fileId}=w1080-h1350-c`,
                                `https://drive.google.com/thumbnail?id=${fileId}&sz=w1080-h1350`,
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No alumni talks available at the moment.</p>
            </div>
          )}
        </div>

        {/* Alumni Spotlight Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Star className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight">🧑‍🎓 Alumni Spotlight</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/alumni-spotlight')}
              className="hidden sm:flex items-center text-primary border-primary hover:bg-primary hover:text-white"
            >
              View All Spotlights
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/alumni-spotlight')}
              className="sm:hidden text-primary border-primary hover:bg-primary hover:text-white"
            >
              View All
            </Button>
          </div>

          {spotlightsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, index) => (
                <Card key={index} className="overflow-hidden shadow-lg animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : alumniSpotlights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {alumniSpotlights.slice(0, 5).map((spotlight, index) => (
                <Card
                  key={index}
                  className="group overflow-hidden shadow-elegant hover:shadow-elegant transition-all duration-500 cursor-pointer transform hover:-translate-y-2 flex flex-col md:flex-row rounded-3xl border-none bg-white relative"
                >
                  {/* Premium Image Container - 40% Width with Zoom Effect */}
                  <div className="md:basis-2/5 relative h-80 md:h-auto overflow-hidden">
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500 z-10" />
                    {spotlight.photoUrl ? (
                      <img
                        src={spotlight.photoUrl}
                        alt={spotlight.name}
                        className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const url = img.src;
                          if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
                            const fileIdPatterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/, /\/open\?id=([a-zA-Z0-9_-]+)/];
                            let fileId = null;
                            for (const pattern of fileIdPatterns) {
                              const match = url.match(pattern);
                              if (match && match[1]) {
                                fileId = match[1];
                                break;
                              }
                            }
                            if (fileId) {
                              const alternativeUrls = [
                                `https://lh3.googleusercontent.com/d/${fileId}=w1000-h1200-c`,
                                `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000-h1200`,
                                `https://drive.google.com/uc?export=view&id=${fileId}`
                              ];
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
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Users className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Floating Year Badge */}
                    <div className="absolute top-4 left-4 z-20">

                    </div>

                    {/* Gradient Overlay for better depth */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/10 md:block hidden z-10" />
                  </div>

                  {/* Premium Details Side - 60% Width */}
                  <div className="md:basis-3/5 p-6 md:p-8 flex flex-col bg-white relative">
                    {/* Top Right School Tag */}
                    <div className="hidden md:block absolute top-6 right-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-primary/5 text-primary border border-primary/10">
                        {spotlight.school || 'University'}
                      </span>
                    </div>

                    <div className="flex-1">
                      {/* Name */}
                      <h3 className="font-bold text-xl md:text-2xl mb-2 md:mb-3 text-primary">{spotlight.name}</h3>

                      {/* Current Position and Company */}
                      <div className="hidden md:block mb-3">
                        <p className="text-lg font-semibold text-foreground">{spotlight.currentPosition || 'Position not specified'}</p>
                        <p className="text-md text-muted-foreground">{spotlight.company || 'Organization not specified'}</p>
                      </div>

                      {/* Achievement / Story - Limited to 5 lines */}
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground italic line-clamp-5">"{spotlight.achievement || 'No story available'}"</p>
                      </div>

                      {/* Department */}
                      <div className="hidden md:block mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent-foreground">
                          {spotlight.department || 'Department N/A'}
                        </span>
                      </div>

                      {/* Registration Number */}
                      <div className="hidden md:block mb-2">
                        <div className="text-sm">
                          <span className="font-medium text-primary">Reg. No: </span>
                          <span className="text-foreground">
                            {(() => {
                              // Find registration number from alumni directory using enhanced matching
                              let student = cachedStudents?.find(s =>
                                s.registrationNo.toString().trim().toLowerCase() === spotlight.registrationNo.toString().trim().toLowerCase()
                              );

                              // If no direct match, try normalized registration number
                              if (!student && spotlight.registrationNo) {
                                const normalizedSpotlightReg = spotlight.registrationNo.toString().trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
                                student = cachedStudents?.find(s => {
                                  const normalizedStudentReg = s.registrationNo.toString().trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
                                  return normalizedStudentReg === normalizedSpotlightReg;
                                });
                              }

                              // If no registration number match, try name match
                              if (!student) {
                                student = cachedStudents?.find(s =>
                                  s.name.toString().trim().toLowerCase() === spotlight.name.toString().trim().toLowerCase()
                                );
                              }

                              // If no direct name match, try normalized name
                              if (!student) {
                                const normalizedSpotlightName = spotlight.name.toString().trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
                                student = cachedStudents?.find(s => {
                                  const normalizedStudentName = s.name.toString().trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
                                  return normalizedStudentName === normalizedSpotlightName;
                                });
                              }

                              return student?.registrationNo || spotlight.registrationNo || 'Not specified';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-primary/10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/alumni-spotlight');
                        }}
                        className="w-full bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/30 text-primary font-semibold rounded-lg transition-all duration-300"
                      >
                        View Full Profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No alumni spotlights available at the moment.</p>
            </div>
          )}
        </div>

        {/* YouTube Video Section - Added above Featured Alumni */}
        {/* <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-full mb-4">
            <Youtube className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-primary mb-4 tracking-tight">Alumni Success Stories</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4 max-w-3xl mx-auto leading-relaxed">Watch inspiring stories from our accomplished alumni</p>
        </div> */}

        {/* YouTube Embed Code Display */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <div className="w-full">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Together We Rise: Co-Founder Address to Our Alumni Family</h3>
                </div>

              </div>

              {/* Custom Video Player without initial YouTube branding */}
              <VideoPlayer />


            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-full mb-4">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#A21035] mb-4 tracking-tight">Alumni Work At</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4 max-w-3xl mx-auto leading-relaxed">Top companies where our graduates excel and make their mark</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {companies.length === 0 ? (
              <>
                <div className="space-y-4">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted-foreground/20 rounded-md"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
                        </div>
                        <div className="h-6 bg-muted-foreground/20 rounded-full w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted-foreground/20 rounded-md"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
                        </div>
                        <div className="h-6 bg-muted-foreground/20 rounded-full w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <ul className="border border-border rounded-lg bg-card divide-y divide-border">
                  {companies.slice(0, 8).map((company, index) => (
                    <li key={`comp-col1-${index}`} className="flex items-center justify-between p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-accent/30 text-xs sm:text-base flex-shrink-0">
                          {company.logo}
                        </span>
                        <span className="text-foreground font-medium text-xs sm:text-base break-words">{company.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-primary bg-accent/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-bold whitespace-nowrap ml-2">
                        <span className="sm:hidden">{company.count}</span>
                        <span className="hidden sm:inline">{company.count} Alumni</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <ul className="border border-border rounded-lg bg-card divide-y divide-border">
                  {companies.slice(8, 16).map((company, index) => (
                    <li key={`comp-col2-${index}`} className="flex items-center justify-between p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-accent/30 text-xs sm:text-base flex-shrink-0">
                          {company.logo}
                        </span>
                        <span className="text-foreground font-medium text-xs sm:text-base break-words">{company.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-primary bg-accent/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-bold whitespace-nowrap ml-2">
                        <span className="sm:hidden">{company.count}</span>
                        <span className="hidden sm:inline">{company.count} Alumni</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>
      {/* Universities Section */}
      <section className="py-4 sm:py-6 bg-muted/30">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-full mb-4">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#A21035] mb-4 tracking-tight">Higher Studies Universities</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4 max-w-3xl mx-auto leading-relaxed">Top universities where our graduates pursue higher education and research</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {universities.length === 0 ? (
              <>
                <div className="space-y-4">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted-foreground/20 rounded-md"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
                        </div>
                        <div className="h-6 bg-muted-foreground/20 rounded-full w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted-foreground/20 rounded-md"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
                        </div>
                        <div className="h-6 bg-muted-foreground/20 rounded-full w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <ul className="border border-border rounded-lg bg-card divide-y divide-border">
                  {universities.slice(0, 8).map((university, index) => (
                    <li key={`uni-col1-${index}`} className="flex items-center justify-between p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-accent/30 text-xs sm:text-base flex-shrink-0">🎓</span>
                        <span className="text-foreground font-medium text-xs sm:text-base break-words">{university.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-primary bg-accent/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-bold whitespace-nowrap ml-2">
                        <span className="sm:hidden">{university.count}</span>
                        <span className="hidden sm:inline">{university.count} Students</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <ul className="border border-border rounded-lg bg-card divide-y divide-border">
                  {universities.slice(8, 16).map((university, index) => (
                    <li key={`uni-col2-${index}`} className="flex items-center justify-between p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-accent/30 text-xs sm:text-base flex-shrink-0">🎓</span>
                        <span className="text-foreground font-medium text-xs sm:text-base break-words">{university.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-primary bg-accent/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-bold whitespace-nowrap ml-2">
                        <span className="sm:hidden">{university.count}</span>
                        <span className="hidden sm:inline">{university.count} Students</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>
      {/* Schools Section - Updated color scheme */}
      <section className="py-6 sm:py-8 lg:py-12 bg-muted/50">
        <div className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 gradient-secondary rounded-full mb-3 sm:mb-4">
              <Building2 className="h-15 w-15 sm:h-10 sm:w-6 text-dark" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 sm:mb-4 tracking-tight">Our Schools</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-2 sm:px-4 max-w-3xl mx-auto leading-relaxed">Excellence across diverse academic disciplines, fostering innovation and professional growth</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
            {schools.map((school, index) => (
              <Card key={school.name} className="group hover:shadow-2xl transition-all duration-500 border border-border bg-card hover:bg-card overflow-hidden transform hover:-translate-y-2 hover:scale-105 rounded-xl sm:rounded-2xl shadow-lg" style={{ minHeight: '140px' }}>
                <CardContent className="p-4 sm:p-6 lg:p-10 text-center relative">
                  <div className={`absolute top-0 left-0 right-0 h-1`} style={{ backgroundColor: `hsl(var(--${school.color}))` }}></div>

                  <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary mb-2 sm:mb-3 transition-colors duration-300">{school.fullName}</h4>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">{school.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Features Section - Updated color scheme */}
      <section className="py-3 sm:py-4 lg:py-6 bg-muted/30">
        <div className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 gradient-secondary rounded-full mb-3 sm:mb-4">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-dark" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 sm:mb-4 tracking-tight">Communication Features</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-2 sm:px-4 max-w-3xl mx-auto leading-relaxed">Seamless interaction across all levels with modern communication tools</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border border-border bg-card hover:bg-card overflow-hidden transform hover:-translate-y-2 hover:scale-105 rounded-xl sm:rounded-2xl shadow-lg">
                <CardContent className="p-4 sm:p-6 lg:p-8 text-center relative">
                  <div className="absolute top-0 left-0 right-0 h-1 gradient-secondary"></div>
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground mb-4 sm:mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-primary mb-2 sm:mb-3 text-center transition-colors duration-300">{feature.title}</h3>
                  <p className="text-xs sm:text-sm lg:text-base mb-3 sm:mb-4 text-center text-muted-foreground leading-relaxed">{feature.description}</p>
                  <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                    {feature.channels.map((channel) => {
                      const getChannelIcon = (channel: string) => {
                        switch (channel) {
                          case 'Phone': return <Phone className="h-2 w-2 sm:h-3 sm:w-3" />;
                          case 'Email': return <Mail className="h-2 w-2 sm:h-3 sm:w-3" />;
                          case 'LinkedIn': return <Linkedin className="h-2 w-2 sm:h-3 sm:w-3" />;
                          default: return null;
                        }
                      };

                      return (
                        <Badge key={channel} variant="outline" className="text-xs border-accent text-primary px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-accent/20 hover:bg-accent hover:text-foreground transition-all duration-200">
                          {getChannelIcon(channel)}
                          <span className="ml-1 text-xs">{channel}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Ready to Connect Section */}
      <section className="py-6 sm:py-8 lg:py-12 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/20"></div>
        <div className="relative max-w-5xl mx-auto text-center px-3 sm:px-4 md:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 sm:mb-6 lg:mb-8 tracking-tight">
            Ready to Connect?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-primary-foreground/90 mb-6 sm:mb-8 lg:mb-10 px-2 sm:px-4 max-w-4xl mx-auto leading-relaxed">
            Join thousands of CUTMAP alumni in our growing network and unlock endless opportunities for growth and collaboration
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center items-center">
            <Button
              size="lg"
              onClick={() => router.push('/alumni-directory')}
              className="bg-card text-primary hover:bg-accent hover:text-foreground font-bold px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base md:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 rounded-lg sm:rounded-xl group w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              <Globe className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
              <span>Explore Alumni Directory</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/SignUp')}
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-bold px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-105 rounded-lg sm:rounded-xl group w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              <span className="text-primary">Register Now</span>
              <ChevronRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={(userRole, student, departmentUser) => {
          login(userRole, student, departmentUser);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
};

export default Home;