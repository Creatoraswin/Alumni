"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import ProfileTab from "@/components/ProfileTab";
import ProfileEdit from "@/components/ProfileEdit";
import UniversalNav from "@/components/UniversalNav";
import { useRouter } from 'next/navigation';
import { updateStudentData, fetchStudentsData } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { isLoggedIn, userRole, currentStudent, logout, setCurrentStudent } = useAuth();
  const router = useRouter();
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const { toast } = useToast();

  // Optionally, handle profile save logic here if editing is enabled
  const handleEditProfile = () => setIsProfileEditOpen(true);
  const handleCloseEdit = () => setIsProfileEditOpen(false);

  // Save handler for profile edit
  const handleSaveProfile = async (updatedStudent) => {
    try {
      console.log('Saving profile with updated student data:', updatedStudent);
      // Use "admin" role to ensure all fields are sent to the backend
      await updateStudentData(updatedStudent, "admin");
      // Fetch latest student data and update currentStudent
      const allStudents = await fetchStudentsData();
      const refreshed = allStudents.find(s => s.registrationNo === updatedStudent.registrationNo);
      if (refreshed) {
        setCurrentStudent(refreshed);
        localStorage.setItem('currentStudent', JSON.stringify(refreshed));
        console.log('Profile updated successfully, new data:', refreshed);
      }
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
      setIsProfileEditOpen(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      toast({ title: "Update failed", description: error.message || "Could not update profile.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center pt-20">
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        currentStudent={currentStudent}
        onLoginClick={() => {}}
        onLogout={handleLogout}
      />
      <div className="w-full max-w-3xl px-2 md:px-0">
        <ProfileTab
          isLoggedIn={isLoggedIn}
          currentStudent={currentStudent}
          onEditProfile={handleEditProfile}
        />
        {/* Optionally render ProfileEdit modal if you want editing here */}
        {isProfileEditOpen && currentStudent && (
          <ProfileEdit
            isOpen={isProfileEditOpen}
            onClose={handleCloseEdit}
            student={currentStudent}
            onSave={handleSaveProfile}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;