"use client";

import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, Users, BarChart2, User, Check, MessageSquare, Youtube, Play, X, GraduationCap } from "lucide-react";
import { UserRole } from "@/contexts/auth-context";
import { useRouter } from 'next/navigation';
// NewsCorner import removed
import { Student } from '@/services/apiService';

interface MobileMenuProps {
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
  onLogout: () => void;
  onLoginClick: () => void;
}

const MobileMenu = ({ isLoggedIn, userRole, currentStudent, currentDepartmentUser, onLogout, onLoginClick }: MobileMenuProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Function to handle navigation and close the menu
  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false); // Close the sheet
  };

  const renderMenuItems = () => {
    if (isLoggedIn && (userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin")) {
      return (
        <div className="space-y-4">
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/")}
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Home</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation(userRole === "admin" ? "/admin" : userRole === "cadmin" ? "/cadmin" : "/alumni-manager")}
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Dashboard</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation(userRole === "admin" ? "/admin/alumni-management" : userRole === "cadmin" ? "/cadmin/alumni-management" : "/alumni-manager/alumni-management")}
          >
            <Users className="w-5 h-5 mr-3" />
            <span>Alumni Management</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation(userRole === "admin" ? "/admin/analytics" : userRole === "cadmin" ? "/cadmin/analytics" : "/alumni-manager/analytics")}
          >
            <BarChart2 className="w-5 h-5 mr-3" />
            <span>Analytics</span>
          </button>
          {(userRole === "admin" || userRole === "alumni-manager" || userRole === "cadmin") && (
            <button
              className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              onClick={() => handleNavigation(userRole === "admin" ? "/admin/feedback" : userRole === "cadmin" ? "/cadmin/feedback" : "/alumni-manager/feedback")}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              <span>Feedback</span>
            </button>
          )}
          {(userRole === "admin" || userRole === "alumni-manager") && (
            <button
              className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              onClick={() => handleNavigation(userRole === "admin" ? "/admin/approval" : "/alumni-manager/approval")}
            >
              <Check className="w-5 h-5 mr-3" />
              <span>Approval</span>
            </button>
          )}
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/alumni-talks")}
          >
            <Users className="w-5 h-5 mr-3" />
            <span>Alumni Talks</span>
          </button>
          {/* News link for admin users */}
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/news")}
          >
            <Youtube className="w-5 h-5 mr-3" />
            <span>News</span>
          </button>
        </div>
      );
    } else if (isLoggedIn && (userRole === "department" || userRole === "school")) {
      return (
        <div className="space-y-4">
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/")}
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Home</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation(userRole === "school" ? "/school" : "/department")}
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Dashboard</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation(userRole === "school" ? "/school/alumni" : "/department/alumni")}
          >
            <Users className="w-5 h-5 mr-3" />
            <span>Alumni Management</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation(userRole === "school" ? "/school/analytics" : "/department/analytics")}
          >
            <BarChart2 className="w-5 h-5 mr-3" />
            <span>Analytics</span>
          </button>
          {/* News link for department/school users */}
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/news")}
          >
            <Youtube className="w-5 h-5 mr-3" />
            <span>News</span>
          </button>
        </div>
      );
    } else if (isLoggedIn && userRole === "student") {
      return (
        <div className="space-y-4">
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/")}
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Home</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/alumni-directory")}
          >
            <Users className="w-5 h-5 mr-3" />
            <span>Alumni Portal</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/news")}
          >
            <Youtube className="w-5 h-5 mr-3" />
            <span>News</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/youtube")}
          >
            <Play className="w-5 h-5 mr-3" />
          
            <span>YouTube</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/profile")}
          >
            <User className="w-5 h-5 mr-3" />
            <span>My Profile</span>
          </button>
        </div>
      );
    } else if (!isLoggedIn) {
      // For non-logged in users
      return (
        <div className="space-y-4">
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/")}
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Home</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/alumni-directory")}
          >
            <Users className="w-5 h-5 mr-3" />
            <span>Alumni Directory</span>
          </button>
          <button
            className="flex items-center w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => handleNavigation("/news")}
          >
            <Youtube className="w-5 h-5 mr-3" />
            <span>News</span>
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Menu</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {renderMenuItems()}
          </div>
          
          <div className="p-4 border-t">
            {isLoggedIn ? (
              <div className="space-y-4">
                {currentStudent && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      {currentStudent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold">{currentStudent.name}</p>
                      <p className="text-sm text-muted-foreground">Student</p>
                    </div>
                  </div>
                )}
                {currentDepartmentUser && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                      {currentDepartmentUser.department.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{currentDepartmentUser.name}</p>
                      <p className="text-sm text-muted-foreground">{currentDepartmentUser.department}</p>
                    </div>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={onLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={onLoginClick}>
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;