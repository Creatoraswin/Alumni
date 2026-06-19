"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, Home, Users, BarChart2, User, Check, MessageSquare, Youtube, Play, Menu } from "lucide-react";
import { Student, getDirectImageUrl } from "@/services/apiService";
import { UserRole } from "@/contexts/auth-context";
import { useRouter, usePathname } from 'next/navigation';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";
import RobustImage from "@/components/RobustImage";
import MobileMenu from "@/components/MobileMenu";

interface HeaderProps {
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
}

const Header = ({ isLoggedIn, userRole, currentStudent, currentDepartmentUser, onLoginClick, onLogout }: HeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  useEffect(() => {
    if (isLoggedIn && userRole === "admin") {
      document.title = "Alumni Dashboard - Admin";
    } else if (isLoggedIn && userRole === "cadmin") {
      document.title = "Alumni Dashboard - Higher Management";
    } else if (isLoggedIn && userRole === "department") {
      document.title = `Alumni Dashboard - ${currentDepartmentUser?.department || 'Department'}`;
    } else if (isLoggedIn && userRole === "school") {
      document.title = `Alumni Dashboard - ${currentDepartmentUser?.department || 'School'}`;
    } else if (isLoggedIn && userRole === "alumni-manager") {
      document.title = "Alumni Dashboard - Alumni Manager";
    } else if (isLoggedIn && userRole === "student") {
      document.title = "Cutmap Alumni details";
    } else {
      document.title = "CUTMAP Alumni Portal";
    }
  }, [isLoggedIn, userRole, currentDepartmentUser]);

  // Determine active tab based on path
  let adminTab = "dashboard";
  const isAdminPath = pathname.startsWith("/admin");
  const isAlumniManagerPath = pathname.startsWith("/alumni-manager");
  const isCadminPath = pathname.startsWith("/cadmin");
  
  if (isAdminPath || isAlumniManagerPath || isCadminPath) {
    if (pathname.includes("/analytics")) adminTab = "analytics";
    else if (pathname.includes("/alumni-management")) adminTab = "alumni-management";
    else if (pathname.includes("/approval")) adminTab = "approval";
    else if (pathname.includes("/feedback")) adminTab = "feedback";
    else adminTab = "dashboard";
  }
  
  // Determine active department/school tab
  const getActiveDepartmentTab = () => {
    const path = pathname;
    if (path.startsWith("/department/alumni") || path.startsWith("/school/alumni")) return "alumni";
    if (path.startsWith("/department/analytics") || path.startsWith("/school/analytics")) return "analytics";
    return "dashboard";
  };
  
  const activeDepartmentTab = getActiveDepartmentTab();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass shadow-elegant border-b border-border/50">
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
            {/* Show Alumni Dashboard title for admin, cadmin, department, and school */}
            {isLoggedIn && (userRole === "admin" || userRole === "cadmin" || userRole === "department" || userRole === "school") && (
              <>
                <button
                  onClick={() => router.push("/")}
                  className="text-lg md:text-2xl font-bold text-gradient-primary focus:outline-none hover:scale-105 transition-transform hidden xs:block"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  tabIndex={0}
                  aria-label="Go to home"
                >
                  Alumni Dashboard
                </button>
                {pathname === "/alumni-directory" && (
                  <div className="hidden sm:flex items-center ml-4">
                    <span className="text-sm md:text-base font-semibold text-muted-foreground">Alumni Directory</span>
                  </div>
                )}
              </>
            )}
            {isLoggedIn && userRole === "student" && (
              <>
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
                {pathname === "/alumni-directory" && (
                  <div className="hidden sm:flex items-center ml-4">
                    <span className="text-sm md:text-base font-semibold text-muted-foreground">Alumni Directory</span>
                  </div>
                )}
              </>
            )}
            {!isLoggedIn && (
              <>
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
                {pathname === "/alumni-directory" && (
                  <div className="hidden sm:flex items-center ml-4">
                    {/* <span className="text-sm md:text-base font-semibold text-muted-foreground">Alumni Directory</span> */}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Mobile menu button - only visible on mobile */}
            <div className="md:hidden">
              <MobileMenu 
                isLoggedIn={isLoggedIn}
                userRole={userRole}
                currentStudent={currentStudent}
                currentDepartmentUser={currentDepartmentUser}
                onLogout={onLogout}
                onLoginClick={onLoginClick}
              />
            </div>
            
            {/* Desktop navigation - hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2 md:space-x-4">
              {isLoggedIn && (userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") ? (
                <>
                  {/* Admin nav first */}
                  <nav className="flex space-x-1 h-12 bg-white rounded-lg shadow-md p-1">
                    <button
                      className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        adminTab === "dashboard" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => navigate(userRole === "admin" ? "/admin" : userRole === "cadmin" ? "/cadmin" : "/alumni-manager")}
                      title="Dashboard"
                    >
                      <Home className="w-5 h-5" />
                      <span className="hidden md:inline ml-1">Dashboard</span>
                    </button>
                    <button
                      className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        adminTab === "alumni-management" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => navigate(userRole === "admin" ? "/admin/alumni-management" : userRole === "cadmin" ? "/cadmin/alumni-management" : "/alumni-manager/alumni-management")}
                      title="Alumni Management"
                    >
                      <Users className="w-5 h-5" />
                      <span className="hidden md:inline ml-1">Alumni Management</span>
                    </button>
                    <button
                      className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        adminTab === "analytics" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => navigate(userRole === "admin" ? "/admin/analytics" : userRole === "cadmin" ? "/cadmin/analytics" : "/alumni-manager/analytics")}
                      title="Analytics"
                    >
                      <BarChart2 className="w-5 h-5" />
                      <span className="hidden md:inline ml-1">Analytics</span>
                    </button>
                    {/* Feedback tab - show for admin and alumni-manager */}
                    {(userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") && (
                      <button
                        className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                          adminTab === "feedback" 
                            ? "bg-red-600 text-white shadow-lg" 
                            : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                        }`}
                        onClick={() => navigate(userRole === "admin" ? "/admin/feedback" : userRole === "cadmin" ? "/cadmin/feedback" : "/alumni-manager/feedback")}
                        title="Feedback"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="hidden md:inline ml-1">Feedback</span>
                      </button>
                    )}
                    {/* Approval tab - only show for admin and alumni-manager, not cadmin */}
                    {(userRole === "admin" || userRole === "alumni-manager") && (
                      <button
                        className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                          adminTab === "approval" 
                            ? "bg-red-600 text-white shadow-lg" 
                            : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                        }`}
                        onClick={() => navigate(userRole === "admin" ? "/admin/approval" : "/alumni-manager/approval")}
                        title="Approval"
                      >
                        <Check className="w-5 h-5" />
                        <span className="hidden md:inline ml-1">Approval</span>
                      </button>
                    )}
                    {/* News link for admin users */}
                    <button
                      className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        pathname === "/news" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => router.push("/news")}
                      title="News"
                    >
                      <Youtube className="w-5 h-5" />
                      <span className="hidden md:inline ml-1">News</span>
                    </button>
                  </nav>
                  {/* Admin profile pic */}
                  {currentStudent && (
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <RobustImage
                        photoUrl={currentStudent.photoUrl}
                        studentName={currentStudent.name}
                        size="sm"
                        className="border-3 border-primary/40 shadow-elegant ring-2 ring-white"
                      />
                    </div>
                  )}
                  {/* Role name */}
                  <Badge className="gradient-secondary text-dark font-semibold shadow-soft text-xs px-3 py-1 flex-shrink-0 inline-flex sm:inline-flex">
                    {userRole === "admin" ? "Admin" : userRole === "cadmin" ? "Higher Management" : "Alumni Manager"}
                  </Badge>
                  {/* Logout button */}
                  <Button
                    variant="outline"
                    onClick={onLogout}
                    size="sm"
                    className="border-primary/30 hover:gradient-accent hover:text-dark text-xs md:text-sm font-semibold shadow-soft hover:shadow-elegant transition-all"
                  >
                    Logout
                  </Button>
                </>
              ) : isLoggedIn && (userRole === "department" || userRole === "school") ? (
                <>
                  {/* Department/School nav - dynamic routes based on role */}
                  <nav className="flex space-x-1 h-12 bg-white rounded-lg shadow-md p-1">
                    <button
                      className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        activeDepartmentTab === "dashboard" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => navigate(userRole === "school" ? "/school" : "/department")}
                      title="Dashboard"
                    >
                      <Home className="w-5 h-5" />
                      <span className="hidden md:inline ml-1">Dashboard</span>
                    </button>
                    <button
                      className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        activeDepartmentTab === "alumni" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => navigate(userRole === "school" ? "/school/alumni" : "/department/alumni")}
                      title="Alumni Management"
                    >
                      <Users className="w-5 h-5" />
                      <span className="hidden md:inline ml-1">Alumni Management</span>
                    </button>
                    <button
                      className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        activeDepartmentTab === "analytics" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => navigate(userRole === "school" ? "/school/analytics" : "/department/analytics")}
                      title="Analytics"
                    >
                      <BarChart2 className="w-5 h-5" />
                      <span className="hidden md:inline ml-1">Analytics</span>
                    </button>
                    {/* News link for department/school users */}
                    <button
                      className={`flex items-center justify-center px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        pathname === "/news" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => router.push("/news")}
                      title="News"
                    >
                      <Youtube className="w-5 h-5" />
                      <span className="hidden md:inline ml-1">News</span>
                    </button>
                  </nav>
                  {/* Department/School user info */}
                  {currentDepartmentUser && (
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Avatar className={`w-8 h-8 md:w-10 md:h-10 border-3 shadow-elegant ring-2 ring-white ${userRole === "school" ? "border-accent/60" : "border-secondary/60"}`}>
                        <AvatarFallback className={`text-xs md:text-sm text-white font-bold ${userRole === "school" ? "gradient-accent" : "gradient-secondary"}`}>
                          {currentDepartmentUser.department.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block">
                        <p className="text-xs md:text-sm font-semibold text-foreground">{currentDepartmentUser.name}</p>
                        <p className="text-xs text-muted-foreground">{currentDepartmentUser.department}</p>
                      </div>
                    </div>
                  )}
                  {/* Department/School role badge - hidden on mobile */}
                  <Badge className={`hidden sm:flex shadow-soft text-xs font-semibold px-3 py-1 ${userRole === "school" ? "gradient-accent text-dark" : "gradient-secondary text-dark"}`}>
                    {currentDepartmentUser?.department || (userRole === "school" ? 'School' : 'Department')}
                  </Badge>
                  {/* Logout button */}
                  <Button
                    variant="outline"
                    onClick={onLogout}
                    size="sm"
                    className="border-primary/30 hover:gradient-accent hover:text-dark text-xs md:text-sm font-semibold shadow-soft hover:shadow-elegant transition-all"
                  >
                    Logout
                  </Button>
                </>
              ) : isLoggedIn && userRole === "student" ? (
                <>
                  {/* Student nav bar - compact on mobile */}
                  <nav className="flex space-x-1 h-12 bg-white rounded-lg shadow-md p-1">
                    <button
                      className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        pathname === "/alumni-directory" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => router.push("/alumni-directory")}
                      title="Alumni Portal at alumni directory"
                    >
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden lg:inline ml-1">Alumni Portal</span>
                    </button>
                    <button
                      className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        pathname === "/news" 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => router.push("/news")}
                      title="News Corner"
                    >
                      <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden lg:inline ml-1">News</span>
                    </button>
                    <button
                      className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                        pathname.startsWith("/profile") 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                      }`}
                      onClick={() => router.push("/profile")}
                      title="My Profile"
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden lg:inline ml-1">My Profile</span>
                    </button>
                  </nav>
                  {/* Student profile/avatar - compact on mobile */}
                  {currentStudent && (
                    <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 border-2 sm:border-3 border-primary/40 shadow-elegant ring-1 sm:ring-2 ring-white">
                        <AvatarImage 
                          src={getDirectImageUrl(currentStudent.photoUrl)} 
                          alt={currentStudent.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-xs md:text-sm gradient-primary text-white font-bold">
                          {currentStudent.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {/* Student name and designation on lg+ screens only */}
                      <div className="hidden lg:block">
                        <p className="text-xs md:text-sm font-semibold text-foreground truncate max-w-32">{currentStudent.name}</p>
                        {currentStudent.designation && currentStudent.designation.toLowerCase() !== "na" && (
                          <p className="text-xs text-muted-foreground truncate max-w-32">
                            {currentStudent.designation}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Badge - hidden on mobile, show on sm+ */}
                  <Badge className="hidden sm:flex gradient-secondary text-dark font-semibold shadow-soft text-xs px-2 sm:px-3 py-1">Student</Badge>
                  {/* Logout button - compact on mobile */}
                  <Button 
                    variant="outline" 
                    onClick={onLogout}
                    size="sm"
                    className="border-primary/30 hover:gradient-accent hover:text-dark text-xs font-semibold shadow-soft hover:shadow-elegant transition-all px-2 sm:px-4"
                  >
                    <span className="sm:hidden">Exit</span>
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/alumni-directory')}
                    className="text-primary hover:text-primary font-medium transition-all duration-200 p-1.5 sm:p-2 rounded-lg group text-xs sm:text-sm hover:shadow-md hover:scale-105 border-2 border-transparent hover:border-primary mr-2"
                  >
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline ml-1 sm:ml-2">Alumni Directory</span>
                  </Button>
                  <button
                    className={`flex items-center justify-center px-2 sm:px-3 py-2 rounded-md transition-all text-sm font-semibold focus:outline-none ${
                      pathname === "/news" 
                        ? "bg-red-600 text-white shadow-lg" 
                        : "text-muted-foreground hover:text-red-600 hover:shadow-sm hover:scale-105"
                    }`}
                    onClick={() => router.push("/news")}
                    title="News"
                  >
                    <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline ml-1">News</span>
                  </button>
                  <Button 
                    onClick={onLoginClick}
                    size="sm"
                    className="gradient-primary hover:scale-105 shadow-glow text-xs md:text-sm text-white font-semibold px-6 py-2 rounded-xl transition-all"
                  >
                    Login / Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;