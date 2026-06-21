"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Student, getDirectImageUrl } from '@/services/apiService';
import { Textarea } from '@/components/ui/textarea';
// Import Lucid icons
import { Camera, Edit, Check, X, Save } from 'lucide-react';

interface ProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSave: (updatedStudent: Student) => void;
}

const ProfileEdit = ({ isOpen, onClose, student, onSave }: ProfileEditProps) => {
  const [photoUrl, setPhotoUrl] = useState(student.photoUrl);
  const [studentStatus, setStudentStatus] = useState<Student['currentPosition']>(student.currentPosition || "NA");
  const [designation, setDesignation] = useState(student.designation === "NA" ? "" : (student.designation || ""));
  const [organisation, setOrganisation] = useState(student.organisation === "NA" ? "" : (student.organisation || ""));
  const [placeOfWork, setPlaceOfWork] = useState(student.placeOfWork === "NA" ? "" : (student.placeOfWork || ""));
  const [areaOfInterest, setAreaOfInterest] = useState(student.areaOfInterest === "NA" ? "" : (student.areaOfInterest || ""));
  const [universityName, setUniversityName] = useState(student.universityName === "NA" ? "" : (student.universityName || ""));
  const [areaOfStudy, setAreaOfStudy] = useState(student.areaOfStudy === "NA" ? "" : (student.areaOfStudy || ""));
  const [location, setLocation] = useState(student.location === "NA" ? "" : (student.location || ""));
  const [personalEmail, setPersonalEmail] = useState(student.personalEmail && student.personalEmail !== "NA" ? student.personalEmail : (student.email || ""));
  const [phone, setPhone] = useState(student.phone === "NA" ? "" : (student.phone || ""));
  const [address, setAddress] = useState(student.address === "NA" ? "" : (student.address || ""));
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [uploadAttempts, setUploadAttempts] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const MAX_UPLOAD_ATTEMPTS = 2;

  const handleSave = () => {
    // Compute the student's current status based on filled fields if not explicitly set
    let computedStatus = studentStatus;
    if (computedStatus === "NA" || !computedStatus) {
      if (universityName && universityName.trim() !== "" && universityName.toLowerCase() !== "na" && 
          areaOfStudy && areaOfStudy.trim() !== "" && areaOfStudy.toLowerCase() !== "na" && 
          location && location.trim() !== "" && location.toLowerCase() !== "na") {
        computedStatus = "Higher study";
      } else if ((organisation && organisation.trim() !== "" && organisation.toLowerCase() !== "na") || 
                 (designation && designation.trim() !== "" && designation.toLowerCase() !== "na")) {
        computedStatus = "Job";
      } else {
        computedStatus = "NA";
      }
    }

    const updatedStudent = {
      ...student,
      photoUrl,
      currentPosition: computedStatus,
      currentJob: computedStatus, // Also update for backward compatibility
      designation: designation || "NA",
      organisation: organisation || "NA",
      placeOfWork: placeOfWork || "NA",
      areaOfInterest: areaOfInterest || "NA",
      universityName: universityName || "NA",
      areaOfStudy: areaOfStudy || "NA",
      location: location || "NA",
      personalEmail: personalEmail || "NA",
      phone: phone || "NA",
      address: address || "NA",
    };


    onSave(updatedStudent);
    onClose();
  };

  const handlePhotoEdit = () => {
    setIsEditingPhoto(true);
    setTempPhotoUrl(photoUrl);
    // Reset upload attempts when starting new upload
    setUploadAttempts(0);
    setUploadSuccess(false);
  };

  const handlePhotoCancel = () => {
    setIsEditingPhoto(false);
    setTempPhotoUrl("");
  };

  const handlePhotoConfirm = () => {
    // Add image URL validation
    if (tempPhotoUrl.trim()) {
      // Check if the URL is a valid image URL
      const isValidImage = tempPhotoUrl.match(/\.(jpeg|jpg|gif|png|bmp|webp)(\?\S*)?$/i);
      
      // Also check for Google Drive URLs
      const isGoogleDriveUrl = tempPhotoUrl.includes('drive.google.com') || tempPhotoUrl.includes('googleusercontent.com');
      
      if (isValidImage || isGoogleDriveUrl) {
        setPhotoUrl(tempPhotoUrl);
        setUploadSuccess(true);
      } else {
        // Show error message if not a valid image URL
        alert('Please enter a valid image URL. Supported formats: JPEG, JPG, GIF, PNG, BMP, WEBP');
        return;
      }
    }
    setIsEditingPhoto(false);
    setTempPhotoUrl("");
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
  };

  const handleUploadAttempt = (attempt: number, success: boolean) => {
    setUploadAttempts(attempt);
    setUploadSuccess(success);
    
    // Update the UI to show attempts
    const attemptText = document.getElementById('profile-upload-attempts');
    if (attemptText) {
      if (success) {
        attemptText.textContent = `Successfully uploaded on attempt ${attempt}`;
        attemptText.style.color = 'green';
      } else {
        attemptText.textContent = `Attempt ${attempt} of ${MAX_UPLOAD_ATTEMPTS}`;
        attemptText.style.color = 'red';
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Profile
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Enhanced Profile Photo Section */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-4 ring-blue-100">
                <AvatarImage 
                  src={getDirectImageUrl(photoUrl)} 
                  alt={student.name}
                  className="object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {student.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              {/* Edit Photo Button */}
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 bg-white shadow-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                onClick={handlePhotoEdit}
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>
            </div>

            {/* Photo URL Input Section */}
            {isEditingPhoto ? (
              <div className="w-full space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="space-y-3">
                  <Label htmlFor="temp-photo-url" className="text-base font-semibold text-gray-700">
                    Update Profile Photo
                  </Label>
                  <Input
                    id="temp-photo-url"
                    placeholder="Paste your new photo URL here"
                    value={tempPhotoUrl}
                    onChange={(e) => setTempPhotoUrl(e.target.value)}
                    className="border-blue-300 focus:border-blue-500"
                  />
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium mb-2">
                      📷 How to upload your photo:
                    </p>
                    <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
                      <li>Upload your photo to Google Drive</li>
                      <li>Right-click and select "Get shareable link"</li>
                      <li>Copy and paste the link above</li>
                      <li>Click "Confirm" to update</li>
                    </ol>
                  </div>
                </div>

                {/* Preview if URL is provided */}
                {tempPhotoUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Preview:</Label>
                    <div className="flex justify-center">
                      <Avatar className="w-20 h-20 border-2 border-gray-200">
                        <AvatarImage 
                          src={getDirectImageUrl(tempPhotoUrl)} 
                          alt="Preview"
                          className="object-cover"
                        />
                        <AvatarFallback className="text-lg bg-gray-300 text-gray-600">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button onClick={handlePhotoConfirm} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    <Check className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                  <Button onClick={handlePhotoCancel} size="sm" variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500">Click the edit button to change your photo</p>
                <div id="profile-upload-attempts" className="mt-2 text-sm">
                  {/* Upload attempt tracking will appear here */}
                </div>
              </div>
            )}
          </div>

          {/* Personal Information Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Personal Information</h3>
            
            <div className="space-y-3">
              <Label htmlFor="personalEmail" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Personal Email</span>
              </Label>
              <Input
                id="personalEmail"
                placeholder="Enter your personal email"
                value={personalEmail}
                onChange={e => setPersonalEmail(e.target.value)}
                className="border-gray-300 focus:border-blue-400 py-3"
              />

              <Label htmlFor="phone" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Phone Number</span>
              </Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="border-gray-300 focus:border-purple-400 py-3"
              />

              <Label htmlFor="address" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Address</span>
              </Label>
              <Textarea
                id="address"
                placeholder="Enter your address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="border-gray-300 focus:border-green-400 py-3 min-h-[80px]"
              />
            </div>
          </div>

          {/* Current Status Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Current Status</h3>
            
            <div className="space-y-3">
              <Label htmlFor="studentStatus" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Current Status</span>
              </Label>
              <select 
                id="studentStatus" 
                value={studentStatus} 
                onChange={(e) => setStudentStatus(e.target.value as Student['currentPosition'])} 
                className="w-full border rounded p-2"
              >
                <option value="Job">Job (Placement)</option>
                <option value="Higher study">Higher study</option>
                <option value="NA">NA</option>
              </select>
            </div>
          </div>

          {/* Professional Information Section */}
          {(studentStatus === "Job" || studentStatus === "NA") && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Professional Information</h3>
              
              <div className="space-y-3">
                <Label htmlFor="designation" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Designation</span>
                </Label>
                <Input
                  id="designation"
                  placeholder="Enter your designation"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="border-gray-300 focus:border-blue-400 py-3"
                />
                
                <Label htmlFor="organisation" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Name of the Organisation</span>
                </Label>
                <Input
                  id="organisation"
                  placeholder="Enter your organisation"
                  value={organisation}
                  onChange={e => setOrganisation(e.target.value)}
                  className="border-gray-300 focus:border-purple-400 py-3"
                />
                
                <Label htmlFor="place-of-work" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Place of work</span>
                </Label>
                <Input
                  id="place-of-work"
                  placeholder="Enter your place of work"
                  value={placeOfWork}
                  onChange={e => setPlaceOfWork(e.target.value)}
                  className="border-gray-300 focus:border-green-400 py-3"
                />
                
                <Label htmlFor="area-of-interest" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Area of interest/expertise</span>
                </Label>
                <Textarea
                  id="area-of-interest"
                  placeholder="Enter your area of interest/expertise"
                  value={areaOfInterest}
                  onChange={e => setAreaOfInterest(e.target.value)}
                  className="border-gray-300 focus:border-yellow-400 py-3 min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Higher Studies Information Section */}
          {(studentStatus === "Higher study" || studentStatus === "NA") && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Higher Studies Information</h3>
              
              <div className="space-y-3">
                <Label htmlFor="university-name" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>University Name</span>
                </Label>
                <Input
                  id="university-name"
                  placeholder="University name or college name"
                  value={universityName}
                  onChange={e => setUniversityName(e.target.value)}
                  className="border-gray-300 focus:border-blue-400 py-3"
                />
                
                <Label htmlFor="area-of-study" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Area of Study</span>
                </Label>
                <Input
                  id="area-of-study"
                  placeholder="Enter your area of study"
                  value={areaOfStudy}
                  onChange={e => setAreaOfStudy(e.target.value)}
                  className="border-gray-300 focus:border-purple-400 py-3"
                />
                
                <Label htmlFor="location" className="text-base font-semibold text-gray-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Location</span>
                </Label>
                <Input
                  id="location"
                  placeholder="Enter your location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="border-gray-300 focus:border-green-400 py-3"
                />
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 py-3">
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 border-gray-300 hover:bg-gray-50 py-3">
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEdit;