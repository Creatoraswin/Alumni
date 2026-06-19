"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { Briefcase, GraduationCap, Users, TrendingUp } from "lucide-react";
import { Student } from "@/services/apiService";

interface EmploymentStatusOverviewProps {
  students: Student[];
}

const EmploymentStatusOverview = ({ students }: EmploymentStatusOverviewProps) => {
  const higherStudyCount = students.filter(s => s.currentJob === "Higher study").length;
  const jobCount = students.filter(s => s.currentJob === "Job").length;
  const naCount = students.length - jobCount - higherStudyCount;
  // Categorize students by employment status using currentjob
  const categorizeEmploymentStatus = (student: Student) => {
    const job = typeof student.currentjob === "string" ? student.currentjob.trim().toLowerCase() : "";
    if (job === "job") return "Job";
    if (job === "higher study" || job === "higher studies") return "Higher Studies";
    return "NA";
  };

  const employmentStats = students.reduce((acc, student) => {
    // Use precomputed values for categories
    acc['Job'] = jobCount;
    acc['Higher Studies'] = higherStudyCount;
    acc['Not Placed'] = naCount;
    return acc;
  }, {} as Record<string, number>);

  const employmentChartData = [
    { name: 'Job', count: employmentStats['Job'] || 0, color: '#10B981' },
    { name: 'Higher Studies', count: employmentStats['Higher Studies'] || 0, color: '#3B82F6' },
    { name: 'Not Placed', count: employmentStats['Not Placed'] || 0, color: '#EF4444' }
  ];

  const totalStudents = students.length;

  const chartConfig = {
    count: {
      label: "Alumni Count",
    },
  };

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4 px-4">
        <CardTitle className="flex items-center space-x-2 text-lg md:text-2xl">
          <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-green-600 rounded-xl shadow-lg">
            <TrendingUp className="h-5 w-5 md:h-7 md:w-7 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-700 to-green-700 bg-clip-text text-transparent font-bold">
            Employment Status Overview
          </span>
        </CardTitle>
        <p className="text-gray-600 mt-2 text-sm md:text-base">Distribution of alumni across different employment categories</p>
      </CardHeader>
      <CardContent className="px-4">
        {/* Desktop: Horizontal layout, Mobile: Stack */}
        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 w-full">
          {/* Left: Employment Chart (60%) */}
          <div className="md:w-3/5 w-full">
            <h3 className="text-base md:text-lg font-semibold mb-3 text-gray-800">Employment Distribution</h3>
            <div className="w-full overflow-hidden">
              <ChartContainer config={chartConfig} className="h-64 md:h-80 w-full">
                <BarChart data={employmentChartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis fontSize={12} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [
                      `${value} alumni (${((value as number / totalStudents) * 100).toFixed(1)}%)`,
                      name
                    ]}
                  />
                  <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                    {employmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
          {/* Right: Category Breakdown (40%) */}
          <div className="md:w-2/5 w-full flex flex-col space-y-4">
            <h3 className="text-base md:text-lg font-semibold mb-3 text-gray-800">Category Breakdown</h3>
            {employmentChartData.map((category) => (
              <div key={category.name} className="flex items-center justify-between p-3 md:p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                  <div 
                    className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
                    {category.name === 'Job' && <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-green-600 flex-shrink-0" />}
                    {category.name === 'Higher Studies' && <GraduationCap className="h-3 w-3 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />}
                    {category.name === 'Not Placed' && <Users className="h-3 w-3 md:h-4 md:w-4 text-red-600 flex-shrink-0" />}
                    <span className="font-medium text-gray-900 text-sm md:text-base truncate">{category.name}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-lg md:text-2xl font-bold" style={{ color: category.color }}>
                    {category.count}
                  </span>
                  <p className="text-xs text-gray-600">
                    {((category.count / totalStudents) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmploymentStatusOverview;