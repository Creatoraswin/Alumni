"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Mail, Briefcase, Calendar, Building, User, GraduationCap, Phone } from "lucide-react";
import { Linkedin } from "lucide-react";
import { Student, getDirectImageUrl } from "@/services/apiService";
import RobustImage from "./RobustImage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface StudentGridProps {
  students: Student[];
  isLoggedIn: boolean;
  loading?: boolean;
  currentUserInfo?: { name: string; registrationNo: string; currentJob?: string };
}

const StudentGrid = ({ students, isLoggedIn, loading = false, currentUserInfo }: StudentGridProps) => {
  const router = useRouter();

  // Skeleton loading component
  const StudentCardSkeleton = () => (
    <Card className="group relative overflow-hidden border-0 card-enhanced bg-card rounded-2xl animate-pulse">
      {/* Enhanced Header with gradient skeleton */}
      <div className="h-14 relative overflow-hidden bg-gradient-to-r from-muted to-muted-foreground/20">
        <div className="absolute top-1 right-2">
          <div className="w-12 h-6 bg-muted-foreground/20 rounded-full"></div>
        </div>
        <div className="absolute top-1 left-2">
          <div className="w-16 h-6 bg-muted-foreground/20 rounded-full"></div>
        </div>
      </div>

      <CardContent className="p-5 -mt-4 relative z-10">
        {/* Main Layout: Photo on left, Details on right */}
        <div className="flex gap-5 mb-5">
          {/* Left: Photo skeleton */}
          <div className="flex-shrink-0 relative">
            <div className="w-16 h-16 bg-muted-foreground/20 rounded-xl"></div>
          </div>
          
          {/* Right: Student Details skeleton */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Name skeleton */}
            <div className="pl-1">
              <div className="h-5 bg-muted-foreground/20 rounded w-3/4 mb-1"></div>
            </div>
            
            {/* Registration No skeleton */}
            <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
            
            {/* Programme skeleton */}
            <div className="flex items-start gap-2 pl-1">
              <div className="w-4 h-4 bg-muted-foreground/20 rounded mt-0.5"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
            </div>
          </div>
        </div>

        {/* Current Position Section skeleton */}
        <div className="mb-4">
          <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-3"></div>
          <div className="p-4 rounded-xl border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-4 h-4 bg-muted-foreground/20 rounded"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-2/3"></div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-muted-foreground/20 rounded"></div>
              <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted-foreground/20 rounded"></div>
              <div className="h-3 bg-muted-foreground/20 rounded w-1/3"></div>
            </div>
          </div>
        </div>

        {/* Interest Subjects skeleton */}
        {isLoggedIn && (
          <div className="mb-4">
            <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-3"></div>
            <div className="flex flex-wrap gap-1">
              <div className="h-6 bg-muted-foreground/20 rounded w-16"></div>
              <div className="h-6 bg-muted-foreground/20 rounded w-20"></div>
            </div>
          </div>
        )}

        {/* Action buttons skeleton */}
        {isLoggedIn && (
          <div className="flex gap-3 pt-4 border-t border-primary/20">
            <div className="flex-1 h-11 bg-muted-foreground/20 rounded-xl"></div>
            <div className="flex-1 h-11 bg-muted-foreground/20 rounded-xl"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Loading state with skeleton cards
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary"></div>
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-primary">Alumni Portal</h2>
              <p className="text-sm text-muted-foreground">at alumni directory</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Loading Alumni Profiles</h3>
          <p className="text-muted-foreground">Fetching the latest alumni information...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <StudentCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Sort students: Job/Higher study students first, then "NA" students at bottom
  const sortedStudents = [...students].sort((a, b) => {
    // Helper function to check if student has complete job information
    const hasCompleteJobInfo = (student: Student) => {
      const hasOrganisation = student.organisation && 
        student.organisation !== "Not specified" && 
        student.organisation !== "NA" &&
        student.organisation.trim() !== "";
      
      const hasPosition = (student.currentPosition && 
        student.currentPosition !== "Not specified" && 
        student.currentPosition !== "NA" &&
        student.currentPosition.trim() !== "") ||
        (student.designation && 
        student.designation !== "Not specified" && 
        student.designation !== "NA" &&
        student.designation.trim() !== "");
      
      return hasOrganisation && hasPosition;
    };

    // Helper function to check if student has complete higher studies information
    const hasCompleteStudiesInfo = (student: Student) => {
      return (student.areaOfStudy && 
        student.areaOfStudy !== "Not specified" && 
        student.areaOfStudy !== "NA") &&
        (student.universityName &&
        student.universityName !== "Not specified" &&
        student.universityName !== "NA");
    };

    // Check completion status for both students
    const aHasJob = hasCompleteJobInfo(a);
    const aHasStudies = hasCompleteStudiesInfo(a);
    const aIsComplete = aHasJob || aHasStudies;

    const bHasJob = hasCompleteJobInfo(b);
    const bHasStudies = hasCompleteStudiesInfo(b);
    const bIsComplete = bHasJob || bHasStudies;

    // Primary sort: Complete info (job or studies) vs incomplete  
    if (aIsComplete && !bIsComplete) return -1;
    if (!aIsComplete && bIsComplete) return 1;

    // Secondary sort: Within same completion status, prioritize job over studies
    if (aIsComplete && bIsComplete) {
      if (aHasJob && !bHasJob) return -1;
      if (!aHasJob && bHasJob) return 1;
    }

    // Tertiary sort: Timestamp (latest first)
    const dateA = a.Timestamp ? new Date(a.Timestamp) : new Date(0);
    const dateB = b.Timestamp ? new Date(b.Timestamp) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const formatValue = (value: unknown): string => {
    if (
      !value ||
      (typeof value === "string" && (
        value.toLowerCase() === "na" ||
        value.toLowerCase() === "null" ||
        value === "Not specified"
      ))
    ) {
      return "Not specified";
    }
    return String(value);
  };

  // Get school color
  const getSchoolColor = (school: string) => {
    switch(school?.toUpperCase()) {
      case 'SOET': return 'school-engineering';
      case 'SOPAHS': return 'school-paramedical';
      case 'SOM': return 'school-management';
      case 'SOCSA': return 'school-agriculture';
      default: return 'accent';
    }
  };

  const handleLinkedInClick = (linkedinUrl: string) => {
    if (linkedinUrl && linkedinUrl !== 'Not specified') {
      // Check if URL starts with http/https, if not add https://
      const url = linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`;
      window.open(url, '_blank');
    }
  };

  const handleContactClick = (student: Student) => {
    if (!student.email) return;
    const subject = `Alumini Connect : ${currentUserInfo?.name}(${currentUserInfo?.registrationNo})`;
    let body = `Hello,

I am reaching out via the CUTMAP Alumni Directory.

 Name: ${currentUserInfo?.name}
 Registration No: ${currentUserInfo?.registrationNo}`;
    if (currentUserInfo?.currentJob) body += `
 Current Job: ${currentUserInfo.currentJob}`;
    body += `

Best regards,
 ${currentUserInfo?.name}

 Genrated by CUTMAP Alumni Portal`;
    const mailtoUrl = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 100);
  };

  // Filter out the logged-in user from the directory
  // For non-logged-in users, only show approved records
  const filteredStudents = (() => {
    let result = [...students];
    
    // Filter out the logged-in user if logged in
    if (isLoggedIn && currentUserInfo?.registrationNo) {
      result = result.filter(s => s.registrationNo !== currentUserInfo.registrationNo);
    }
    
    // For non-logged-in users, only show approved records
    if (!isLoggedIn) {
      result = result.filter(student => student.Status === 'Approved');
    }
    
    return result;
  })();

  if (filteredStudents.length === 0) {
    return (
      <Card className="p-16 text-center border-0 shadow-xl bg-secondary">
        <div className="text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h3 className="text-2xl font-bold mb-4 text-foreground">No alumni found</h3>
          <p className="text-lg text-muted-foreground">Try adjusting your search criteria or filters.</p>
        </div>
      </Card>
    );
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredStudents.map((student, index) => {
        const schoolColor = getSchoolColor(student.school);
        
        return (
          // Removed hover-lift class to fix white on hover issue
          <Card 
            key={`${student.id}-${index}`} 
            className="group relative overflow-hidden border-0 card-enhanced animate-fade-in-up bg-card rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform shadow-md hover:shadow-elegant" 
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => router.push(`/alumni-directory/${student.registrationNo}`)}
          >
            {/* Enhanced Header with School Color */}
            <div className="h-14 relative overflow-hidden" style={{background: `linear-gradient(135deg, hsl(var(--${schoolColor})), hsl(var(--primary)))`}}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-1 right-2">
                <Badge className="glass text-primary border-white/40 px-2 py-1 text-xs font-bold shadow-soft">
                  {student.graduationYear}
                </Badge>
              </div>
              <div className="absolute top-1 left-2">
                <Badge className="glass text-white border-white/40 px-2 py-1 text-xs font-bold shadow-soft" style={{backgroundColor: `hsl(var(--${schoolColor}))`}}>
                  {student.school}
                </Badge>
              </div>
            </div>

          <CardContent className="p-5 -mt-4 relative z-10">
              {/* Main Layout: Photo on left, Details on right */}
            <div className="flex gap-5 mb-5">
              {/* Left: Photo with LinkedIn icon */}
              <div className="flex-shrink-0 relative">
                <div style={{borderColor: `hsl(var(--${schoolColor}))`}} className="border-3 border-white shadow-elegant rounded-xl ring-2 ring-primary/20">
                  <RobustImage
                    photoUrl={student.photoUrl}
                    studentName={student.name}
                    size="md"
                    className="rounded-xl"
                  />
                </div>
                
                {/* LinkedIn Icon positioned at photo bottom-right corner - Only show when logged in */}
                {isLoggedIn && formatValue(student.linkedinId) !== "Not specified" && (
                  <div className="absolute -bottom-1 -right-1">
                    <button
                      onClick={() => handleLinkedInClick(student.linkedinId)}
                      className="p-1.5 rounded-full hover:scale-110 transition-all shadow-glow"
                      style={{background: `linear-gradient(135deg, hsl(var(--${schoolColor})), hsl(var(--primary)))`}}
                    >
                      <Linkedin className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Right: Student Details */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Name with padding */}
                <div className="pl-1">
                  <h3 className="font-bold text-foreground text-lg leading-tight mb-1 text-gradient-primary">
                    {student.name}
                  </h3>
                </div>
                
                {/* Registration No */}
                <p className="text-xs text-muted-foreground font-mono italic pl-1 bg-secondary/30 px-2 py-1 rounded-lg">
                  {student.registrationNo}
                </p>
                
                {/* Programme - Full text display */}
                <div className="flex items-start gap-2 pl-1">
                  <GraduationCap className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    {student.programme}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Position Section - Full width */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gradient-primary mb-3">Current Position:</h4>
              <div className="p-4 gradient-card rounded-xl border shadow-soft" style={{borderColor: `hsl(var(--${schoolColor})/30)`}}>
                <div className="flex items-center gap-3 mb-3">
                  <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-sm font-bold text-foreground leading-relaxed">
                    {formatValue(student.designation)}
                  </p>
                </div>
                
                {formatValue(student.organisation) !== "Not specified" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Building className="h-3.5 w-3.5" />
                    <span className="leading-relaxed">{formatValue(student.organisation)}</span>
                  </div>
                )}
                
                {formatValue(student.location) !== "Not specified" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="leading-relaxed">{formatValue(student.location)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interest Subjects */}
            {isLoggedIn && student.areaOfInterest && student.areaOfInterest !== "Not specified" && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gradient-primary mb-2">Interest Subjects:</h4>
                <div className="flex flex-wrap gap-1">
                  {student.areaOfInterest.split(',').map((subject, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs py-1 px-2 rounded-full">
                      {subject.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons - Only show when logged in */}
            {isLoggedIn && (
              <div className="flex gap-3 pt-4 border-t border-primary/20">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-sm h-11 font-bold shadow-glow hover:scale-105 border-0 rounded-xl transition-all duration-300 relative z-20"
                  style={{background: `linear-gradient(135deg, hsl(var(--${schoolColor})), hsl(var(--primary)))`, color: 'white'}}
                  onClick={(e) => { e.stopPropagation(); handleContactClick(student); }}
                  disabled={!student.email || student.email === "Not specified"}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-sm h-11 font-bold shadow-glow hover:scale-105 border-0 rounded-xl transition-all duration-300 relative z-20"
                  style={{background: `linear-gradient(135deg, hsl(var(--${schoolColor})), hsl(var(--primary)))`, color: 'white'}}
                  onClick={(e) => { e.stopPropagation(); handleLinkedInClick(student.linkedinId); }}
                  disabled={!student.linkedinId || student.linkedinId === "Not specified"}
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
              </div>
            )}

            {/* View Profile Button - Removed as requested */}
          </CardContent>
        </Card>
      );
    })}
  </div>
);
};

export default StudentGrid;