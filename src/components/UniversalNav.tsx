import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Home, Users, BarChart2, User, Youtube, GraduationCap, Menu, Star, ChevronLeft, ChevronRight, LayoutDashboard, TrendingUp, MessageSquare, UserCheck, Mic2, Newspaper, UserCog, BarChart3 } from "lucide-react";
import { Student, getDirectImageUrl } from "@/services/apiService";
import { UserRole } from "@/contexts/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useEffect } from "react";
import { useSidebar } from "@/components/AppLayoutWrapper";

interface UniversalNavProps {
  isLoggedIn: boolean;
  userRole: UserRole | null;
  currentStudent: Student | null;
  currentDepartmentUser?: {
    username: string;
    role: string;
    department: string;
    name: string;
    email: string;
  } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  className?: string;
}

const UniversalNav = ({ 
  isLoggedIn, 
  userRole, 
  currentStudent, 
  currentDepartmentUser, 
  onLoginClick, 
  onLogout,
  className = ""
}: UniversalNavProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarExpanded, toggleSidebar } = useSidebar();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlumniCornerOpen, setIsAlumniCornerOpen] = useState(false);
  const [isAnalyticsDropdownOpen, setIsAnalyticsDropdownOpen] = useState(false);

  // Determine active tab based on path
  const getActiveTab = (): "home" | "alumni" | "news" | "alumni-talks" | "alumni-meets" | "alumni-spotlight" | "youtube" | "profile" | "analytics" | "detailed-analytics" | "alumni-management" | "approval" | "feedback" | "dashboard" | "academic" | "student-strength" | "users" => {
    if (pathname === "/") return "home";
    if (pathname === "/alumni-directory") return "alumni";
    if (pathname === "/news") return "news";
    if (pathname === "/alumni-talks") return "alumni-talks";
    if (pathname === "/alumni-meets") return "alumni-meets";
    if (pathname === "/alumni-spotlight") return "alumni-spotlight";
    if (pathname === "/youtube") return "youtube";
    if (pathname === "/profile") return "profile";
    
    // Admin paths
    if (pathname.startsWith("/admin") || 
        pathname.startsWith("/cadmin") || 
        pathname.startsWith("/alumni-manager")) {
      if (pathname.includes("/detailed-analytics")) return "detailed-analytics";
      if (pathname.includes("/analytics")) return "analytics";
      if (pathname.includes("/alumni-management")) return "alumni-management";
      if (pathname.includes("/student-strength")) return "student-strength";
      if (pathname.includes("/approval")) return "approval";
      if (pathname.includes("/feedback")) return "feedback";
      if (pathname.includes("/academic")) return "academic";
      if (pathname.includes("/users")) return "users";
      return "dashboard";
    }
    
    // Department/School paths
    if (pathname.startsWith("/department") || 
        pathname.startsWith("/school")) {
      if (pathname.includes("/alumni")) return "alumni";
      if (pathname.includes("/detailed-analytics")) return "detailed-analytics";
      if (pathname.includes("/analytics")) return "analytics";
      return "dashboard";
    }
    
    return "home";
  };

  const activeTab = getActiveTab();

  // Handle navigation and close mobile menu
  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMenuOpen(false); // Close mobile menu after navigation
    setIsAlumniCornerOpen(false); // Close alumni corner dropdown
  };

  // Toggle alumni corner dropdown
  const toggleAlumniCorner = () => {
    setIsAlumniCornerOpen(!isAlumniCornerOpen);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isAlumniCornerOpen) setIsAlumniCornerOpen(false);
      if (isAnalyticsDropdownOpen) setIsAnalyticsDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isAlumniCornerOpen, isAnalyticsDropdownOpen]);

  // Render desktop navigation items based on user role
  const renderDesktopNavItems = () => {
    if (isLoggedIn && (userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin")) {
      return (
        <>
          <button
            className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "dashboard" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push(userRole === "admin" ? "/admin" : userRole === "cadmin" ? "/cadmin" : "/alumni-manager")}
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
            <span className="hidden md:inline ml-1">Dashboard</span>
          </button>
          <button
            className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "alumni-management" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push(userRole === "admin" ? "/admin/alumni-management" : userRole === "cadmin" ? "/cadmin/alumni-management" : "/alumni-manager/alumni-management")}
            title="Alumni Management"
          >
            <Users className="w-5 h-5" />
            <span className="hidden md:inline ml-1">Alumni Management</span>
          </button>
          <div className="relative">
            <button
              className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                (activeTab === "analytics" || activeTab === "detailed-analytics") 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                // Toggle the analytics dropdown
                setIsAnalyticsDropdownOpen(!isAnalyticsDropdownOpen);
              }}
              title="Analytics"
            >
              <BarChart2 className="w-5 h-5" />
              <span className="hidden md:inline ml-1">Analytics</span>
              <svg 
                className={`ml-1 w-4 h-4 transition-transform ${isAnalyticsDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Analytics dropdown */}
            {isAnalyticsDropdownOpen && (
              <div 
                id="analytics-dropdown"
                className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "analytics" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    if (userRole === "admin") {
                      router.push("/admin/analytics");
                    } else if (userRole === "cadmin") {
                      router.push("/cadmin/analytics");
                    } else if (userRole === "alumni-manager") {
                      router.push("/alumni-manager/analytics");
                    }
                    setIsAnalyticsDropdownOpen(false);
                    setIsMenuOpen(false);
                  }}
                >
                  Basic Analytics
                </button>
                {(userRole === "admin" || userRole === "alumni-manager") && (
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      activeTab === "detailed-analytics" 
                        ? "bg-red-600 text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      if (userRole === "admin") {
                        router.push("/admin/detailed-analytics");
                      } else if (userRole === "alumni-manager") {
                        router.push("/alumni-manager/detailed-analytics");
                      }
                      setIsAnalyticsDropdownOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    Detailed Analytics
                  </button>
                )}
              </div>
            )}
          </div>
          {(userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") && (
            <button
              className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                activeTab === "feedback" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
              }`}
              onClick={() => router.push(userRole === "admin" ? "/admin/feedback" : userRole === "cadmin" ? "/cadmin/feedback" : "/alumni-manager/feedback")}
              title="Feedback"
            >
              <GraduationCap className="w-5 h-5" />
              <span className="hidden md:inline ml-1">Feedback</span>
            </button>
          )}
          {(userRole === "admin" || userRole === "alumni-manager") && (
            <button
              className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                activeTab === "approval" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
              }`}
              onClick={() => router.push(userRole === "admin" ? "/admin/approval" : "/alumni-manager/approval")}
              title="Approval"
            >
              <User className="w-5 h-5" />
              <span className="hidden md:inline ml-1">Approval</span>
            </button>
          )}

          {/* Alumni Corner dropdown */}
          <div className="relative">
            <button
              className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                (activeTab === "alumni-talks" || activeTab === "alumni-spotlight" || activeTab === "academic" || activeTab === "users") 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleAlumniCorner();
              }}
              title="Alumni Corner"
            >
              <Users className="w-5 h-5" />
              <span className="hidden md:inline ml-1">Alumni Corner</span>
              <svg 
                className={`ml-1 w-4 h-4 transition-transform ${isAlumniCornerOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isAlumniCornerOpen && (
              <div 
                className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "alumni-talks" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleNavigation("/alumni-talks")}
                >
                  Alumni Talks
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "alumni-spotlight" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleNavigation("/alumni-spotlight")}
                >
                  Alumni Spotlight
                </button>
                {(userRole === "admin" || userRole === "alumni-manager") && (
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      activeTab === "academic" 
                        ? "bg-red-600 text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      router.push(userRole === "admin" ? "/admin/academic" : "/alumni-manager/academic");
                      setIsAlumniCornerOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    Academic Data
                  </button>
                )}
                {userRole === "admin" && (
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      activeTab === "student-strength" 
                        ? "bg-red-600 text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      router.push("/admin/student-strength");
                      setIsAlumniCornerOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    Student Strength
                  </button>
                )}
                {(userRole === "admin") && (
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      activeTab === "users" 
                        ? "bg-red-600 text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      router.push("/admin/users");
                      setIsAlumniCornerOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    Users Management
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* News link for admin users */}
          <button
            className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "news" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push("/news")}
            title="News"
          >
            <Youtube className="w-5 h-5" />
            <span className="hidden md:inline ml-1">News</span>
          </button>
        </>
      );
    } else if (isLoggedIn && (userRole === "department" || userRole === "school")) {
      return (
        <>
          <button
            className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "dashboard" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push(userRole === "school" ? "/school" : "/department")}
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
            <span className="hidden md:inline ml-1">Dashboard</span>
          </button>
          <button
            className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "alumni" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push(userRole === "school" ? "/school/alumni" : "/department/alumni")}
            title="Alumni Management"
          >
            <Users className="w-5 h-5" />
            <span className="hidden md:inline ml-1">Alumni Management</span>
          </button>
          <div className="relative">
            <button
              className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                (activeTab === "analytics" || activeTab === "detailed-analytics") 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsAnalyticsDropdownOpen(!isAnalyticsDropdownOpen);
              }}
              title="Analytics"
            >
              <BarChart2 className="w-5 h-5" />
              <span className="hidden md:inline ml-1">Analytics</span>
              <svg 
                className={`ml-1 w-4 h-4 transition-transform ${isAnalyticsDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Analytics dropdown */}
            {isAnalyticsDropdownOpen && (
              <div 
                id="analytics-dropdown-dept-school"
                className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "analytics" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    router.push(userRole === "school" ? "/school/analytics" : "/department/analytics");
                    setIsAnalyticsDropdownOpen(false);
                    setIsMenuOpen(false);
                  }}
                >
                  Basic Analytics
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "detailed-analytics" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    router.push(userRole === "school" ? "/school/detailed-analytics" : "/department/detailed-analytics");
                    setIsAnalyticsDropdownOpen(false);
                    setIsMenuOpen(false);
                  }}
                >
                  Detailed Analytics
                </button>
              </div>
            )}
          </div>
          {/* Alumni Corner dropdown */}
          <div className="relative">
            <button
              className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                (activeTab === "alumni-talks" || activeTab === "alumni-spotlight") 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleAlumniCorner();
              }}
              title="Alumni Corner"
            >
              <Users className="w-5 h-5" />
              <span className="hidden md:inline ml-1">Alumni Corner</span>
              <svg 
                className={`ml-1 w-4 h-4 transition-transform ${isAlumniCornerOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isAlumniCornerOpen && (
              <div 
                className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "alumni-talks" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleNavigation("/alumni-talks")}
                >
                  Alumni Talks
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "alumni-spotlight" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleNavigation("/alumni-spotlight")}
                >
                  Alumni Spotlight
                </button>
              </div>
            )}
          </div>
          {/* News link for department/school users */}
          <button
            className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "news" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push("/news")}
            title="News"
          >
            <Youtube className="w-5 h-5" />
            <span className="hidden md:inline ml-1">News</span>
          </button>
        </>
      );
    } else if (isLoggedIn && userRole === "student") {
      return (
        <>
          <button
            className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "alumni" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push("/alumni-directory")}
            title="Alumni Portal"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden lg:inline ml-1">Alumni Portal</span>
          </button>
          {/* Alumni Corner dropdown */}
          <div className="relative">
            <button
              className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                (activeTab === "alumni-talks" || activeTab === "alumni-spotlight") 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleAlumniCorner();
              }}
              title="Alumni Corner"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden lg:inline ml-1 whitespace-nowrap">Alumni Corner</span>
              <svg 
                className={`ml-1 w-4 h-4 transition-transform ${isAlumniCornerOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isAlumniCornerOpen && (
              <div 
                className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "alumni-talks" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleNavigation("/alumni-talks")}
                >
                  Alumni Talks
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "alumni-spotlight" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleNavigation("/alumni-spotlight")}
                >
                  Alumni Spotlight
                </button>
              </div>
            )}
          </div>
          <button
            className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "news" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push("/news")}
            title="News"
          >
            <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden lg:inline ml-1">News</span>
          </button>
          <button
            className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "youtube" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push("/youtube")}
            title="YouTube"
          >
            <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden lg:inline ml-1">YouTube</span>
          </button>
          <button
            className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "profile" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push("/profile")}
            title="My Profile"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden lg:inline ml-1">My Profile</span>
          </button>
        </>
      );
    } else {
      // Non-logged in users
      return (
        <>
          <button
            className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "alumni" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push("/alumni-directory")}
            title="Alumni Directory"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline ml-1">Alumni Directory</span>
          </button>
          {/* Alumni Corner dropdown */}
          <div className="relative">
            <button
              className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                (activeTab === "alumni-talks" || activeTab === "alumni-spotlight") 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleAlumniCorner();
              }}
              title="Alumni Corner"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline ml-1 whitespace-nowrap">Alumni Corner</span>
              <svg 
                className={`ml-1 w-4 h-4 transition-transform ${isAlumniCornerOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isAlumniCornerOpen && (
              <div 
                className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "alumni-talks" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleNavigation("/alumni-talks")}
                >
                  Alumni Talks
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === "alumni-spotlight" 
                      ? "bg-red-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleNavigation("/alumni-spotlight")}
                >
                  Alumni Spotlight
                </button>
              </div>
            )}
          </div>
          <button
            className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
              activeTab === "news" 
                ? "bg-red-600 text-white shadow-lg" 
                : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
            }`}
            onClick={() => router.push("/news")}
            title="News"
          >
            <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline ml-1">News</span>
          </button>
        </>
      );
    }
  };

  // Render mobile navigation items based on user role
  const renderMobileNavItems = () => {
    if (isLoggedIn && (userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin")) {
      const iconClass = `w-5 h-5 flex-shrink-0 ${isSidebarExpanded ? 'mr-3' : ''}`;
      return (
        <div className="w-full space-y-1">
          <button
            title="Home"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "home" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation("/")}
          >
            <Home className={iconClass} />
            {isSidebarExpanded && <span>Home</span>}
          </button>
          <button
            title="Dashboard"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "dashboard" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation(userRole === "admin" ? "/admin" : userRole === "cadmin" ? "/cadmin" : "/alumni-manager")}
          >
            <LayoutDashboard className={iconClass} />
            {isSidebarExpanded && <span>Dashboard</span>}
          </button>
          <button
            title="Alumni Management"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "alumni-management" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation(userRole === "admin" ? "/admin/alumni-management" : userRole === "cadmin" ? "/cadmin/alumni-management" : "/alumni-manager/alumni-management")}
          >
            <Users className={iconClass} />
            {isSidebarExpanded && <span>Alumni Management</span>}
          </button>
          <button
            title="Basic Analytics"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "analytics" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation(userRole === "admin" ? "/admin/analytics" : userRole === "cadmin" ? "/cadmin/analytics" : "/alumni-manager/analytics")}
          >
            <BarChart2 className={iconClass} />
            {isSidebarExpanded && <span>Basic Analytics</span>}
          </button>
          {(userRole === "admin" || userRole === "alumni-manager") && (
            <button
              title="Detailed Analytics"
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "detailed-analytics" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "hover:bg-secondary/50"
              } ${!isSidebarExpanded ? 'justify-center' : ''}`}
              onClick={() => handleNavigation(userRole === "admin" ? "/admin/detailed-analytics" : "/alumni-manager/detailed-analytics")}
            >
              <TrendingUp className={iconClass} />
              {isSidebarExpanded && <span>Detailed Analytics</span>}
            </button>
          )}
          {(userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") && (
            <button
              title="Feedback"
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "feedback" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "hover:bg-secondary/50"
              } ${!isSidebarExpanded ? 'justify-center' : ''}`}
              onClick={() => handleNavigation(userRole === "admin" ? "/admin/feedback" : userRole === "cadmin" ? "/cadmin/feedback" : "/alumni-manager/feedback")}
            >
              <MessageSquare className={iconClass} />
              {isSidebarExpanded && <span>Feedback</span>}
            </button>
          )}
          {(userRole === "admin" || userRole === "alumni-manager") && (
            <button
              title="Approval"
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "approval" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "hover:bg-secondary/50"
              } ${!isSidebarExpanded ? 'justify-center' : ''}`}
              onClick={() => handleNavigation(userRole === "admin" ? "/admin/approval" : "/alumni-manager/approval")}
            >
              <UserCheck className={iconClass} />
              {isSidebarExpanded && <span>Approval</span>}
            </button>
          )}

          {/* Alumni Corner section */}
          <div className={`${isSidebarExpanded ? 'border-t border-gray-200 pt-3 mt-2' : 'border-t border-gray-200/50 pt-2 mt-1'}`}>
            {isSidebarExpanded && <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Alumni Corner</h3>}
            <button
              title="Alumni Talks"
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "alumni-talks" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "hover:bg-secondary/50"
              } ${!isSidebarExpanded ? 'justify-center' : ''}`}
              onClick={() => handleNavigation("/alumni-talks")}
            >
              <Mic2 className={iconClass} />
              {isSidebarExpanded && <span>Alumni Talks</span>}
            </button>
            <button
              title="Alumni Spotlight"
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "alumni-spotlight" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "hover:bg-secondary/50"
              } ${!isSidebarExpanded ? 'justify-center' : ''}`}
              onClick={() => handleNavigation("/alumni-spotlight")}
            >
              <Star className={iconClass} />
              {isSidebarExpanded && <span>Alumni Spotlight</span>}
            </button>
            {(userRole === "admin" || userRole === "alumni-manager") && (
              <button
                title="Academic"
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                  activeTab === "academic" 
                    ? "bg-red-600 text-white shadow-lg" 
                    : "hover:bg-secondary/50"
                } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                onClick={() => handleNavigation(userRole === "admin" ? "/admin/academic" : "/alumni-manager/academic")}
              >
                <GraduationCap className={iconClass} />
                {isSidebarExpanded && <span>Academic</span>}
              </button>
            )}
            {userRole === "admin" && (
              <button
                title="Student Strength"
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                  activeTab === "student-strength" 
                    ? "bg-red-600 text-white shadow-lg" 
                    : "hover:bg-secondary/50"
                } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                onClick={() => handleNavigation("/admin/student-strength")}
              >
                <BarChart3 className={iconClass} />
                {isSidebarExpanded && <span>Student Strength</span>}
              </button>
            )}
            {userRole === "admin" && (
              <button
                title="Users"
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                  activeTab === "users" 
                    ? "bg-red-600 text-white shadow-lg" 
                    : "hover:bg-secondary/50"
                } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                onClick={() => handleNavigation("/admin/users")}
              >
                <UserCog className={iconClass} />
                {isSidebarExpanded && <span>Users</span>}
              </button>
            )}
          </div>
          
          {/* News link */}
          <button
            title="News"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "news" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation("/news")}
          >
            <Newspaper className={iconClass} />
            {isSidebarExpanded && <span>News</span>}
          </button>
        </div>
      );
    } else if (isLoggedIn && (userRole === "department" || userRole === "school")) {
      const iconClass = `w-5 h-5 flex-shrink-0 ${isSidebarExpanded ? 'mr-3' : ''}`;
      return (
        <div className="w-full space-y-1">
          <button
            title="Home"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "home" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation("/")}
          >
            <Home className={iconClass} />
            {isSidebarExpanded && <span>Home</span>}
          </button>
          <button
            title="Dashboard"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "dashboard" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation(userRole === "school" ? "/school" : "/department")}
          >
            <LayoutDashboard className={iconClass} />
            {isSidebarExpanded && <span>Dashboard</span>}
          </button>
          <button
            title="Alumni Management"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "alumni" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation(userRole === "school" ? "/school/alumni" : "/department/alumni")}
          >
            <Users className={iconClass} />
            {isSidebarExpanded && <span>Alumni Management</span>}
          </button>
          <button
            title="Basic Analytics"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "analytics" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation(userRole === "school" ? "/school/analytics" : "/department/analytics")}
          >
            <BarChart2 className={iconClass} />
            {isSidebarExpanded && <span>Basic Analytics</span>}
          </button>
          <button
            title="Detailed Analytics"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "detailed-analytics" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation(userRole === "school" ? "/school/detailed-analytics" : "/department/detailed-analytics")}
          >
            <TrendingUp className={iconClass} />
            {isSidebarExpanded && <span>Detailed Analytics</span>}
          </button>
          
          {/* Alumni Corner section */}
          <div className={`${isSidebarExpanded ? 'border-t border-gray-200 pt-3 mt-2' : 'border-t border-gray-200/50 pt-2 mt-1'}`}>
            {isSidebarExpanded && <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Alumni Corner</h3>}
            <button
              title="Alumni Talks"
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "alumni-talks" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "hover:bg-secondary/50"
              } ${!isSidebarExpanded ? 'justify-center' : ''}`}
              onClick={() => handleNavigation("/alumni-talks")}
            >
              <Mic2 className={iconClass} />
              {isSidebarExpanded && <span>Alumni Talks</span>}
            </button>
            <button
              title="Alumni Spotlight"
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "alumni-spotlight" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "hover:bg-secondary/50"
              } ${!isSidebarExpanded ? 'justify-center' : ''}`}
              onClick={() => handleNavigation("/alumni-spotlight")}
            >
              <Star className={iconClass} />
              {isSidebarExpanded && <span>Alumni Spotlight</span>}
            </button>
          </div>
          
          {/* News link */}
          <button
            title="News"
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "news" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
            onClick={() => handleNavigation("/news")}
          >
            <Newspaper className={iconClass} />
            {isSidebarExpanded && <span>News</span>}
          </button>
        </div>
      );
    } else if (isLoggedIn && userRole === "student") {
      return (
        <div className="space-y-4">
          <button
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "home" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            }`}
            onClick={() => handleNavigation("/")}
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Home</span>
          </button>
          <button
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "alumni" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            }`}
            onClick={() => handleNavigation("/alumni-directory")}
          >
            <Users className="w-5 h-5 mr-3" />
            <span>Alumni Portal</span>
          </button>
          
          {/* Alumni Corner section for mobile */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="px-3 text-sm font-semibold text-gray-500 mb-2">Alumni Corner</h3>
            <button
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "alumni-talks" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "hover:bg-secondary/50"
              }`}
              onClick={() => handleNavigation("/alumni-talks")}
            >
              <Users className="w-5 h-5 mr-3" />
              <span>Alumni Talks</span>
            </button>
            <button
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "alumni-spotlight" 
                  ? "bg-red-600 text-white shadow-lg" 
                  : "hover:bg-secondary/50"
              }`}
              onClick={() => handleNavigation("/alumni-spotlight")}
            >
              <Star className="w-5 h-5 mr-3" />
              <span>Alumni Spotlight</span>
            </button>
          </div>
          
          <button
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "news" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            }`}
            onClick={() => handleNavigation("/news")}
          >
            <Youtube className="w-5 h-5 mr-3" />
            <span>News</span>
          </button>
          <button
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "youtube" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            }`}
            onClick={() => handleNavigation("/youtube")}
          >
            <Youtube className="w-5 h-5 mr-3" />
            <span>YouTube</span>
          </button>
          <button
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "profile" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            }`}
            onClick={() => handleNavigation("/profile")}
          >
            <User className="w-5 h-5 mr-3" />
            <span>My Profile</span>
          </button>
        </div>
      );
    } else {
      // Non-logged in users
      return (
        <div className="space-y-4">
          <button
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "home" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            }`}
            onClick={() => handleNavigation("/")}
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Home</span>
          </button>
          <button
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "alumni" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            }`}
            onClick={() => handleNavigation("/alumni-directory")}
          >
            <Users className="w-5 h-5 mr-3" />
            <span>Alumni Directory</span>
          </button>
          
          {/* Alumni Corner section for mobile */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="px-3 text-sm font-semibold text-gray-500 mb-2">Alumni Corner</h3>
            <button
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "alumni-talks" 
                  ? "bg-red-600 text-white" 
                  : "hover:bg-secondary/50"
              }`}
              onClick={() => handleNavigation("/alumni-talks")}
            >
              <Users className="w-5 h-5 mr-3" />
              <span>Alumni Talks</span>
            </button>
            <button
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                activeTab === "alumni-spotlight" 
                  ? "bg-red-600 text-white" 
                  : "hover:bg-secondary/50"
              }`}
              onClick={() => handleNavigation("/alumni-spotlight")}
            >
              <Star className="w-5 h-5 mr-3" />
              <span>Alumni Spotlight</span>
            </button>
          </div>
          
          <button
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activeTab === "news" 
                ? "bg-red-600 text-white shadow-lg" 
                : "hover:bg-secondary/50"
            }`}
            onClick={() => handleNavigation("/news")}
          >
            <Youtube className="w-5 h-5 mr-3" />
            <span>News</span>
          </button>
        </div>
      );
    }
  };

  return (
    <>
      {!isLoggedIn ? (
        <>
          <header className={`fixed top-0 left-0 right-0 z-50 glass shadow-elegant border-b border-border/50 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16 md:h-18">
                <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
                  <button
                    onClick={() => router.push("/")}
                    className="p-2 md:p-3 bg-white rounded-xl shadow-glow hover:scale-105 transition-all duration-200 focus:outline-none"
                    aria-label="Go to home"
                  >
                    <img 
                      src="/Centurion-University-AP-logo.webp" 
                      alt="Centurion University Logo" 
                      className="h-12 w-8 sm:h-16 sm:w-10 md:h-20 md:w-12 pt-1 sm:pt-2 object-contain"
                    />
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="text-lg font-bold text-gradient-primary focus:outline-none hover:scale-105 transition-transform hidden sm:block"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    tabIndex={0}
                    aria-label="Go to home"
                  >
                    CUTMAP Alumni Portal
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="text-base font-bold text-gradient-primary focus:outline-none hover:scale-105 transition-transform sm:hidden"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    tabIndex={0}
                    aria-label="Go to home"
                  >
                    CUTMAP Alumni
                  </button>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                  <div className="md:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="md:hidden h-12 w-12 border-2 border-primary/50 text-primary shadow-sm rounded-xl flex items-center justify-center p-0">
                          <Menu className="h-8 w-8" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
                        <div className="flex flex-col h-full">
                          <div className="p-4 border-b">
                            <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
                            <SheetDescription className="sr-only">Navigation menu for mobile devices</SheetDescription>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4">
                            {renderMobileNavItems()}
                          </div>
                          <div className="p-4 border-t">
                            <Button className="w-full gradient-primary hover:bg-primary/90 text-white" onClick={onLoginClick}>
                              Login / Sign Up
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <div className="hidden md:flex items-center space-x-2 md:space-x-4">
                    <nav className="flex space-x-1 h-12 bg-white rounded-lg shadow-md p-1">
                      {renderDesktopNavItems()}
                    </nav>
                    <Button 
                      onClick={onLoginClick}
                      size="sm"
                      className="gradient-primary hover:scale-105 shadow-glow text-xs md:text-sm text-white font-semibold px-6 py-2 rounded-xl transition-all"
                    >
                      Login / Sign Up
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>
          {/* Spacer to push content down when logged out */}
          <div className="h-16 md:h-18 w-full shrink-0"></div>
        </>
      ) : (
        <>
          {/* Mobile Top Navigation (Logged In) */}
          <header className={`lg:hidden fixed top-0 left-0 right-0 z-50 glass shadow-elegant border-b border-border/50 ${className}`}>
            <div className="px-4 sm:px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <button onClick={() => router.push("/")} className="p-2 bg-white rounded-xl shadow-glow focus:outline-none">
                    <img src="/Centurion-University-AP-logo.webp" alt="Logo" className="h-12 w-8 object-contain" />
                  </button>
                  <span className="font-bold text-gradient-primary">Alumni Dashboard</span>
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-10 w-10 border-2 border-primary/50 text-primary shadow-sm rounded-xl flex items-center justify-center p-0">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
                    <div className="p-4 border-b"><SheetTitle>Menu</SheetTitle></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">{renderMobileNavItems()}</div>
                    <div className="p-4 border-t">
                      <Button variant="outline" className="w-full hover:bg-red-50 hover:text-red-600 transition-colors border-red-100" onClick={onLogout}>Logout</Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>
          {/* Mobile spacer */}
          <div className="h-16 w-full shrink-0 lg:hidden"></div>

          {/* Desktop Left Sidebar */}
          <aside className={`hidden lg:flex fixed top-0 left-0 h-screen ${isSidebarExpanded ? 'w-64' : 'w-20'} transition-all duration-300 flex-col bg-white/95 backdrop-blur-md shadow-elegant border-r border-border/50 z-50`}>
            {/* Toggle Button */}
            <button 
              onClick={toggleSidebar}
              className="absolute -right-3 top-6 bg-white border border-border rounded-full p-1 shadow-md hover:bg-secondary/20 z-50 transition-colors"
            >
              {isSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Logo */}
            <div className={`flex flex-col items-center border-b border-border/50 shrink-0 ${isSidebarExpanded ? 'p-6' : 'px-2 py-4'}`}>
              <button onClick={() => router.push("/")} className={`bg-white rounded-2xl shadow-glow hover:scale-105 transition-all ${isSidebarExpanded ? 'p-3' : 'p-2'}`}>
                <img src="/Centurion-University-AP-logo.webp" alt="Logo" className={`${isSidebarExpanded ? 'h-16 w-12' : 'h-10 w-8'} object-contain transition-all`} />
              </button>
              {isSidebarExpanded && (
                <span className="mt-4 font-bold text-gradient-primary text-center leading-tight">
                  {userRole === "student" ? "CUTMAP Alumni" : "Alumni Dashboard"}
                </span>
              )}
            </div>

            {/* Nav Items */}
            <div className={`flex-1 overflow-y-auto ${isSidebarExpanded ? 'p-4' : 'p-2'} custom-scrollbar`}>
              <div className={`${isSidebarExpanded ? 'space-y-1' : 'flex flex-col items-center gap-1 w-full'}`}>
                {renderMobileNavItems()}
              </div>
            </div>

            {/* Footer */}
            <div className={`border-t border-border/50 bg-gray-50/50 shrink-0 ${isSidebarExpanded ? 'p-4' : 'px-2 py-4'}`}>
              {isSidebarExpanded ? (
                <div className="flex flex-col space-y-3">
                  {!currentStudent && !currentDepartmentUser && (
                    <div className="bg-white p-2 rounded-lg shadow-sm text-center">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                        {userRole === 'admin' ? 'Administrator' : 
                         userRole === 'cadmin' ? 'Higher Mgmt' : 
                         userRole === 'alumni-manager' ? 'Alumni Mgr' : 'User'}
                      </p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full hover:bg-red-50 hover:text-red-600 transition-colors border-red-100" onClick={onLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="icon" className="w-10 h-10 mx-auto hover:bg-red-50 hover:text-red-600 transition-colors border-red-100 rounded-full flex" onClick={onLogout} title="Logout">
                  <User className="w-5 h-5" />
                </Button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default UniversalNav;
