"use client";

import { Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TalksFilterSectionProps {
  totalCount: number;
  visibleCount: number;
  allSchools: string[];
  allDepartments: string[];
  selectedSchool: string;
  selectedDepartment: string;
  searchTerm: string;
  onSchoolChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  // New props for additional filters
  allYears?: string[];
  allProgrammes?: string[];
  selectedYear: string;
  selectedProgramme: string;
  onYearChange: (value: string) => void;
  onProgrammeChange: (value: string) => void;
}

const TalksFilterSection = (props: TalksFilterSectionProps) => {
  const hasActiveFilters = props.searchTerm || props.selectedSchool !== "all" || props.selectedDepartment !== "all" || props.selectedYear !== "all" || props.selectedProgramme !== "all";

  return (
    <div className="glass pt-6 px-6 rounded-2xl shadow-elegant border border-primary/20 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 gradient-primary rounded-xl shadow-glow">
            <Users className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gradient-primary">
            Search & Filter Alumni Talks
          </h2>
        </div>
        <div className="text-xs sm:text-sm md:text-sm text-muted-foreground gradient-secondary px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-soft font-semibold">
          Showing <span className="font-bold text-primary">{props.visibleCount}</span> of <span className="font-bold text-dark">{props.totalCount}</span> talks
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        <div className="space-y-2 w-full">
          <label className="text-xs sm:text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 gradient-primary rounded-full shadow-soft"></div>
            <span className="text-xs sm:text-sm">Search</span>
          </label>
          <Input
            placeholder="Search by name, reg no, school, department"
            value={props.searchTerm}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="input-enhanced focus-enhanced text-sm hover:bg-primary/5 transition-colors"
          />
        </div>
        {/* Hide all filters except search on mobile, show all on md+ */}
        <div className="hidden md:block space-y-2">
          <label className="text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-3 h-3 gradient-secondary rounded-full shadow-soft"></div>
            <span>School</span>
          </label>
          <Select value={props.selectedSchool} onValueChange={props.onSchoolChange}>
            <SelectTrigger className="input-enhanced focus-enhanced [&_*]:bg-background hover:bg-primary/5 transition-colors">
              <SelectValue placeholder="All Schools" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all" className="hover:!bg-primary hover:!text-primary-foreground cursor-pointer data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground">All Schools</SelectItem>
              {props.allSchools.map(s => (<SelectItem key={s} value={s} className="hover:!bg-primary hover:!text-primary-foreground cursor-pointer data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground">{s}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block space-y-2">
          <label className="text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-3 h-3 gradient-accent rounded-full shadow-soft"></div>
            <span>Graduation Year</span>
          </label>
          <Select value={props.selectedYear} onValueChange={props.onYearChange}>
            <SelectTrigger className="input-enhanced focus-enhanced [&_*]:bg-background hover:bg-primary/5 transition-colors">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all" className="hover:!bg-primary hover:!text-primary-foreground cursor-pointer data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground">All Years</SelectItem>
              {props.allYears?.map(year => (<SelectItem key={year} value={year} className="hover:!bg-primary hover:!text-primary-foreground cursor-pointer data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground">{year}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block space-y-2">
          <label className="text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full shadow-soft"></div>
            <span>Programme</span>
          </label>
          <Select value={props.selectedProgramme} onValueChange={props.onProgrammeChange}>
            <SelectTrigger className="input-enhanced focus-enhanced [&_*]:bg-background hover:bg-primary/5 transition-colors">
              <SelectValue placeholder="All Programmes" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all" className="hover:!bg-primary hover:!text-primary-foreground cursor-pointer data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground">All Programmes</SelectItem>
              {props.allProgrammes?.map(programme => (<SelectItem key={programme} value={programme} className="hover:!bg-primary hover:!text-primary-foreground cursor-pointer data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground">{programme}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block space-y-2">
          <label className="text-sm font-bold text-foreground flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent rounded-full shadow-soft"></div>
            <span>Department</span>
          </label>
          <Select value={props.selectedDepartment} onValueChange={props.onDepartmentChange}>
            <SelectTrigger className="input-enhanced focus-enhanced [&_*]:bg-background hover:bg-primary/5 transition-colors">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all" className="hover:!bg-primary hover:!text-primary-foreground cursor-pointer data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground">All Departments</SelectItem>
              {props.allDepartments.map(d => (<SelectItem key={d} value={d} className="hover:!bg-primary hover:!text-primary-foreground cursor-pointer data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground">{d}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-primary/20">
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={props.onClear}
            className="border-primary/30 text-muted-foreground hover:gradient-accent hover:text-dark font-semibold shadow-soft hover:shadow-elegant transition-all rounded-xl text-xs sm:text-sm"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default TalksFilterSection;