"use client";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Edit, GraduationCap, Briefcase } from "lucide-react";
import { Student, getDirectImageUrl } from "@/services/apiService";
import { formatDateForDisplay } from "@/lib/dateUtils";

interface ProfileTabProps {
  isLoggedIn: boolean;
  currentStudent: Student | null;
  onEditProfile: () => void;
}



const ProfileTab = ({ isLoggedIn, currentStudent, onEditProfile }: ProfileTabProps) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Profile
            </span>
          </CardTitle>
          {isLoggedIn && currentStudent && (
            <Button
              onClick={onEditProfile}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoggedIn && currentStudent ? (
          <div className="space-y-10">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 space-y-4 md:space-y-0">
              <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-4 ring-blue-200">
                <AvatarImage
                  src={getDirectImageUrl(currentStudent.photoUrl)}
                  alt={currentStudent.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {currentStudent.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  {currentStudent.name}
                  {currentStudent.designation && currentStudent.designation.toLowerCase() !== "na" && currentStudent.designation.trim() !== "" && (
                    <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 text-xs font-semibold shadow">
                      {currentStudent.designation}
                    </Badge>
                  )}
                  {currentStudent.currentPosition && currentStudent.currentPosition.toLowerCase() === "higher study" && (
                    <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-2 py-1 text-xs font-semibold shadow">
                      Higher Study
                    </Badge>
                  )}
                  {currentStudent.currentPosition && currentStudent.currentPosition.toLowerCase() === "job" && (
                    <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 text-xs font-semibold shadow">
                      Job
                    </Badge>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2 items-center">
                  {currentStudent.currentPosition && currentStudent.currentPosition.toLowerCase() === "higher study" ? (
                    <>
                      {currentStudent.universityName && currentStudent.universityName.toLowerCase() !== "na" && currentStudent.universityName.trim() !== "" && (
                        <>
                          <span className="text-blue-700 font-medium text-lg">{currentStudent.universityName}</span>
                          <span className="text-gray-500">|</span>
                        </>
                      )}
                      {currentStudent.areaOfStudy && currentStudent.areaOfStudy.toLowerCase() !== "na" && currentStudent.areaOfStudy.trim() !== "" && (
                        <span className="text-purple-700 font-medium text-lg">{currentStudent.areaOfStudy}</span>
                      )}
                    </>
                  ) : currentStudent.currentPosition && currentStudent.currentPosition.toLowerCase() === "job" ? (
                    <>
                      {currentStudent.organisation && currentStudent.organisation.toLowerCase() !== "na" && currentStudent.organisation.trim() !== "" && (
                        <>
                          <span className="text-blue-700 font-medium text-lg">{currentStudent.organisation}</span>
                          <span className="text-gray-500">|</span>
                        </>
                      )}
                      {currentStudent.programme && currentStudent.programme.toLowerCase() !== "na" && currentStudent.programme.trim() !== "" && (
                        <span className="text-purple-700 font-medium text-lg">{currentStudent.programme}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500 italic">No current information available</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Professional Information */}
            {currentStudent.currentPosition &&
              currentStudent.currentPosition.toLowerCase() === "job" && (
                <Card className="rounded-2xl shadow border-0 bg-gradient-to-br from-green-50 to-white">
                  <CardHeader className="pb-2 flex flex-row items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-700 text-lg font-bold tracking-wide">Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0">
                    <div><span className="font-semibold text-gray-700">Current Position:</span> {currentStudent.currentPosition}</div>
                    {currentStudent.designation && currentStudent.designation.toLowerCase() !== "na" && currentStudent.designation.trim() !== "" && (
                      <div><span className="font-semibold text-gray-700">Designation:</span> {currentStudent.designation}</div>
                    )}
                    {currentStudent.organisation && currentStudent.organisation.toLowerCase() !== "na" && currentStudent.organisation.trim() !== "" && (
                      <div><span className="font-semibold text-gray-700">Name of the Organisation:</span> {currentStudent.organisation}</div>
                    )}
                    {currentStudent.placeOfWork && currentStudent.placeOfWork.toLowerCase() !== "na" && currentStudent.placeOfWork.trim() !== "" && (
                      <div><span className="font-semibold text-gray-700">Place of Work:</span> {currentStudent.placeOfWork}</div>
                    )}
                    {currentStudent.areaOfInterest && currentStudent.areaOfInterest.toLowerCase() !== "na" && currentStudent.areaOfInterest.trim() !== "" && (
                      <div><span className="font-semibold text-gray-700">Area of Interest/Expertise:</span> {currentStudent.areaOfInterest}</div>
                    )}
                    {currentStudent.linkedinId && currentStudent.linkedinId.toLowerCase() !== "na" && currentStudent.linkedinId.trim() !== "" && (
                      <div><span className="font-semibold text-gray-700">LinkedIn:</span> {currentStudent.linkedinId}</div>
                    )}
                  </CardContent>
                </Card>
              )}

            {/* Section: Higher Study Information (conditionally rendered) */}
            {currentStudent.currentPosition && currentStudent.currentPosition.toLowerCase() === "higher study" && (
              <Card className="rounded-2xl shadow border-0 bg-gradient-to-br from-yellow-50 to-white">
                <CardHeader className="pb-2 flex flex-row items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-yellow-700 text-lg font-bold tracking-wide">Higher Study Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0">
                  {currentStudent.universityName && currentStudent.universityName.toLowerCase() !== "na" && currentStudent.universityName.trim() !== "" && (
                    <div><span className="font-semibold text-gray-700">University Name:</span> {currentStudent.universityName}</div>
                  )}
                  {currentStudent.areaOfStudy && currentStudent.areaOfStudy.toLowerCase() !== "na" && currentStudent.areaOfStudy.trim() !== "" && (
                    <div><span className="font-semibold text-gray-700">Area of Study:</span> {currentStudent.areaOfStudy}</div>
                  )}
                  {currentStudent.location && currentStudent.location.toLowerCase() !== "na" && currentStudent.location.trim() !== "" && (
                    <div><span className="font-semibold text-gray-700">Location:</span> {currentStudent.location}</div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Section: Academic Information */}
            <Card className="rounded-2xl shadow border-0 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-purple-700 text-lg font-bold tracking-wide">Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0">
                <div><span className="font-semibold text-gray-700">Registration No.:</span> {currentStudent.registrationNo}</div>
                <div><span className="font-semibold text-gray-700">School:</span> {currentStudent.school}</div>
                <div><span className="font-semibold text-gray-700">Department:</span> {currentStudent.department}</div>
                <div><span className="font-semibold text-gray-700">Programme:</span> {currentStudent.programme}</div>
                <div><span className="font-semibold text-gray-700">Graduation Year:</span> {currentStudent.graduationYear}</div>

              </CardContent>
            </Card>

            {/* Section: Personal Information */}
            <Card className="rounded-2xl shadow border-0 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-700 text-lg font-bold tracking-wide">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0">
                <div><span className="font-semibold text-gray-700">Email:</span> {currentStudent.email}</div>
                {currentStudent.personalEmail && <div><span className="font-semibold text-gray-700">Personal Email:</span> {currentStudent.personalEmail}</div>}
                <div><span className="font-semibold text-gray-700">Phone:</span> {currentStudent.phone}</div>
                <div><span className="font-semibold text-gray-700">DOB:</span> {formatDateForDisplay(currentStudent.dob) || "Not specified"}</div>
                <div className="md:col-span-2"><span className="font-semibold text-gray-700">Address:</span> {currentStudent.address}</div>
              </CardContent>
            </Card>

          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">
              Please log in to view your profile.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
