"use client";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, MapPin, Building, GraduationCap, User, Briefcase, MessageSquare, Clock, Globe } from "lucide-react";
import { Student } from "@/services/apiService";
import RobustImage from "@/components/RobustImage";

interface FeedbackPageProps {
  students: Student[];
}

const FeedbackPage = ({ students }: FeedbackPageProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary rounded-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Alumni Feedback & Complete Details
          </h2>
        </div>
        
        <div className="text-sm text-muted-foreground bg-secondary px-4 py-2 rounded-lg">
          Complete alumni database with all submitted information including feedback and personal details.
        </div>
      </div>

      <div className="space-y-6">
        {students.map((student, index) => (
          <Card key={`${student.id}-${index}`} className="shadow-lg border border-border bg-card">
            <CardHeader className="bg-secondary border-b border-border">
              <div className="flex items-center space-x-4">
                <RobustImage
                  photoUrl={student.photoUrl}
                  studentName={student.name}
                  size="lg"
                  className="border-4 border-card shadow-lg"
                />
                <div>
                  <CardTitle className="text-xl text-foreground">{student.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Registration: {student.registrationNo}</p>
                  <Badge className="mt-1 bg-secondary text-foreground">
                    {student.programme} - {student.graduationYear}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    Personal Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Email Addresses</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.email !== student.email && (
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Mobile Number</p>
                        <p className="text-sm text-muted-foreground">{student.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Date of Birth</p>
                        <p className="text-sm text-muted-foreground">
                          {student.dob ? (() => {
                            // Format date consistently with DD/MM/YYYY format
                            if (!student.dob || student.dob === "NA") return 'Not provided';
                            

                            
                            // Check if the date is in XX/XX/YYYY format (could be MM/DD/YYYY or DD/MM/YYYY)
                            const xyxyyyy = student.dob.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                            if (xyxyyyy) {
                              const [, first, second, year] = xyxyyyy;
                              const firstNum = parseInt(first, 10);
                              const secondNum = parseInt(second, 10);
                              
                              // If first number > 12, it's likely DD/MM/YYYY format already
                              if (firstNum > 12) {

                                return student.dob;
                              }
                              
                              // If second number > 12, it's likely MM/DD/YYYY and needs conversion
                              if (secondNum > 12) {
                                const converted = `${second.padStart(2, '0')}/${first.padStart(2, '0')}/${year}`;

                                return converted;
                              }
                              
                              // If both numbers <= 12, assume it's MM/DD/YYYY and convert it
                              const converted = `${second.padStart(2, '0')}/${first.padStart(2, '0')}/${year}`;

                              return converted;
                            }
                            
                            // Try to parse and format the date
                            try {
                              // Handle ISO format dates specifically
                              if (student.dob.includes('T') || student.dob.includes('-')) {
                                const date = new Date(student.dob);
                                if (!isNaN(date.getTime())) {
                                  // Use UTC methods to avoid timezone issues
                                  const day = date.getUTCDate().toString().padStart(2, '0');
                                  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                                  const year = date.getUTCFullYear();
                                  const converted = `${day}/${month}/${year}`;

                                  return converted;
                                }
                              }
                              
                              // For other formats, try standard parsing
                              const date = new Date(student.dob);
                              if (!isNaN(date.getTime())) {
                                const day = date.getDate().toString().padStart(2, '0');
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const year = date.getFullYear();
                                const converted = `${day}/${month}/${year}`;

                                return converted;
                              }
                            } catch (error) {
                              // If parsing fails, return original date
                              console.warn('Date parsing failed:', error);
                            }

                            return student.dob;
                          })() : 'Not provided'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Address</p>
                        <p className="text-sm text-muted-foreground">{student.address || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">LinkedIn Profile</p>
                        <p className="text-sm text-muted-foreground">{student.linkedinId || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic & Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    Academic & Professional
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Building className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">School & Programme</p>
                        <p className="text-sm text-muted-foreground">{student.school}</p>
                        <p className="text-sm text-muted-foreground">{student.programme}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Graduation Year</p>
                        <p className="text-sm text-muted-foreground">{student.graduationYear}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Current Position</p>
                        <p className="text-sm text-muted-foreground">{student.currentJob}</p>
                        <p className="text-sm text-muted-foreground">{student.designation}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Building className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Organization & Location</p>
                        <p className="text-sm text-muted-foreground">{student.organisation}</p>
                        <p className="text-sm text-muted-foreground">{student.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Area of Interest</p>
                        <p className="text-sm text-muted-foreground">{student.areaOfInterest || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {student.skills.length > 0 && student.skills[0] !== 'Not specified' && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {student.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* University Feedback */}
              {student.feedback && student.feedback !== 'Not provided' && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    University Feedback
                  </h3>
                  <div className="bg-secondary border border-border rounded-lg p-4">
                    <p className="text-foreground italic">"{student.feedback}"</p>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Form submitted on: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeedbackPage;
