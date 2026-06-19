"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Briefcase, GraduationCap, University } from "lucide-react";
import { Student } from "@/services/apiService";

interface JobRolesDistributionProps {
  students: Student[];
}

const JobRolesDistribution = ({ students }: JobRolesDistributionProps) => {
  // Exclusion list for job roles and designations
  const EXCLUDE_VALUES = [
    'student', 'higher studies', 'studying', 'null', 'nil', 'no'
  ];

  // Filter for Job Designations and Higher Study
  const jobDesignations = students.filter(s => s.currentDesignation && s.designation.toLowerCase() !== "na");
  const higherStudy = students.filter(s => s.universityName && s.universityName.toLowerCase() !== "na");

  // Count occurrences for each designation and university
  const designationStats = jobDesignations.reduce((acc, s) => {
    const key = s.designation.trim();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const universityStats = higherStudy.reduce((acc, s) => {
    const key = s.universityName.trim();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare chart/list data
  const designationChartData = Object.entries(designationStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([designation, count]) => ({
      name: designation.length > 20 ? designation.substring(0, 20) + '...' : designation,
      fullName: designation,
      count,
      percentage: ((count / jobDesignations.length) * 100).toFixed(1)
    }));
  const universityChartData = Object.entries(universityStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([university, count]) => ({
      name: university.length > 20 ? university.substring(0, 20) + '...' : university,
      fullName: university,
      count,
      percentage: ((count / higherStudy.length) * 100).toFixed(1)
    }));

  const DESIGNATION_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
  const UNIVERSITY_COLORS = ['#F59E0B', '#6366F1', '#3B82F6', '#8B5CF6', '#10B981', '#06B6D4', '#84CC16', '#F97316'];

  const chartConfig = {
    count: {
      label: "Alumni Count",
    },
  };

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4 px-4">
        <CardTitle className="flex items-center space-x-2 text-lg md:text-2xl">
          <div className="p-2 md:p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <Briefcase className="h-5 w-5 md:h-7 md:w-7 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent font-bold">
            Job Roles & Designations
          </span>
        </CardTitle>
        <p className="text-gray-600 mt-2 text-sm md:text-base">Breakdown of alumni by job designations and higher study universities</p>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Job Designations Section */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-3 text-blue-800 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" /> Job Designations
            </h3>
            <div className="space-y-2 md:space-y-3">
              {designationChartData.length === 0 && <div className="text-gray-400">No job designations found.</div>}
              {designationChartData.map((item, index) => (
                <div key={item.fullName} className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: DESIGNATION_COLORS[index % DESIGNATION_COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs md:text-sm text-blue-900 truncate">{item.fullName}</p>
                      <p className="text-xs text-blue-600">{item.percentage}% of alumni</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-xs text-blue-800">
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          {/* Higher Study Section */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-3 text-purple-800 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-500" /> Higher Study
            </h3>
            <div className="space-y-2 md:space-y-3">
              {universityChartData.length === 0 && <div className="text-gray-400">No higher study universities found.</div>}
              {universityChartData.map((item, index) => (
                <div key={item.fullName} className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: UNIVERSITY_COLORS[index % UNIVERSITY_COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs md:text-sm text-purple-900 truncate">{item.fullName}</p>
                      <p className="text-xs text-purple-600">{item.percentage}% of alumni</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-xs text-purple-800">
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobRolesDistribution;
