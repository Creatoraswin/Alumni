"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { Student } from "@/services/apiService";

interface FilterSectionProps {
  students: Student[];
  filteredStudents: Student[];
  selectedYear: string;
  selectedSchool: string;
  selectedProgramme: string;
  selectedDepartment?: string;
  searchTerm: string;
  onYearChange: (value: string) => void;
  onSchoolChange: (value: string) => void;
  onProgrammeChange: (value: string) => void;
  onDepartmentChange?: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

const FilterSection = ({
  students,
  filteredStudents,
  selectedYear,
  selectedSchool,
  selectedProgramme,
  selectedDepartment = "all",
  searchTerm,
  onYearChange,
  onSchoolChange,
  onProgrammeChange,
  onDepartmentChange,
  onSearchChange,
  onClearFilters
}: FilterSectionProps) => {
  const years = Array.from(new Set(students.map(s => s.graduationYear))).sort().reverse();
  // Dynamic dropdowns for School, Programme, Department
  const schools = Array.from(new Set(students.map(s => s.school).filter(Boolean))).sort();
  const programmes = Array.from(new Set(students.map(s => s.programme).filter(Boolean))).sort();
  const departments = [
    { value: "all", label: "All Departments" },
    ...Array.from(new Set(students.map(s => s.department).filter(Boolean)))
      .sort()
      .map(dept => ({ value: dept, label: dept }))
  ];

  const hasActiveFilters = searchTerm || selectedSchool !== "all" || selectedYear !== "all" || (selectedDepartment && selectedDepartment !== "all");

  return (
    <div className="glass pt-6 px-6 rounded-2xl shadow-elegant border border-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
        <div className="p-2 gradient-primary rounded-xl shadow-glow">
          <Users className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gradient-primary">
          Search & Filter Alumni
        </h2>
        </div>
        <div className="text-xs sm:text-sm md:text-sm text-muted-foreground gradient-secondary px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-soft font-semibold">
          Showing <span className="font-bold text-primary">{filteredStudents.length}</span> of <span className="font-bold text-dark">{students.length}</span> alumni
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8">
        {/* Hide all filters except search on mobile, show all on md+ */}
        <div className="space-y-2 w-full">
          <label className="text-xs sm:text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 gradient-primary rounded-full shadow-soft"></div>
            <span className="text-xs sm:text-sm">Search</span>
          </label>
          <Input
            placeholder="Search by name, registration number, job, organization..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-enhanced focus-enhanced text-sm"
          />
        </div>
        <div className="hidden md:block space-y-2">
          <label className="text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-3 h-3 gradient-secondary rounded-full shadow-soft"></div>
            <span>School</span>
          </label>
          <Select value={selectedSchool} onValueChange={onSchoolChange}>
            <SelectTrigger className="input-enhanced focus-enhanced">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer hover:bg-primary focus:bg-primary">All Schools</SelectItem>
              {schools.map(school => (
                <SelectItem key={school} value={school} className="cursor-pointer hover:bg-primary focus:bg-primary">
                  {school}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block space-y-2">
          <label className="text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-3 h-3 gradient-accent rounded-full shadow-soft"></div>
            <span>Graduation Year</span>
          </label>
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="input-enhanced focus-enhanced">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer hover:bg-primary focus:bg-primary">All Years</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year} className="cursor-pointer hover:bg-primary focus:bg-primary">
                  Year of {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block space-y-2">
          <label className="text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full shadow-soft"></div>
            <span>Programme</span>
          </label>
          <Select value={selectedProgramme} onValueChange={onProgrammeChange}>
            <SelectTrigger className="input-enhanced focus-enhanced">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer hover:bg-primary focus:bg-primary">All Programmes</SelectItem>
              {programmes.map(programme => (
                <SelectItem key={programme} value={programme} className="cursor-pointer hover:bg-primary focus:bg-primary">
                  {programme}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block space-y-2">
          <label className="text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent rounded-full shadow-soft"></div>
            <span>Department</span>
          </label>
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger className="input-enhanced focus-enhanced">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept.value} value={dept.value} className="cursor-pointer hover:bg-primary focus:bg-primary">
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-primary/20">
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="border-primary/30 text-muted-foreground hover:gradient-accent hover:text-dark font-semibold shadow-soft hover:shadow-elegant transition-all rounded-xl text-xs sm:text-sm"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterSection;