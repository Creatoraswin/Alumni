"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building } from "lucide-react";
import { Student } from "@/services/apiService";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DepartmentDistributionChartProps {
  students: Student[];
}

// Define types for tooltip and label props
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      fullName: string;
      totalAlumni: number;
    };
    value: number;
  }>;
}

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percentage: number;
}

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{payload[0].payload.fullName}</p>
        <p className="text-blue-600">
          Count: <span className="font-bold">{payload[0].value}</span>
        </p>
        <p className="text-gray-600 text-sm">
          {((payload[0].value / payload[0].payload.totalAlumni) * 100).toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="#374151" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="600"
    >
      {`${percentage}%`}
    </text>
  );
};

const DepartmentDistributionChart = ({ students }: DepartmentDistributionChartProps) => {
  const totalAlumni = students.length;
  const departmentStats = students.reduce((acc, student) => {
    acc[student.department] = (acc[student.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentData = Object.entries(departmentStats)
    .sort(([,a], [,b]) => b - a)
    .map(([name, value]) => ({ 
      name: name.length > 20 ? name.substring(0, 20) + '...' : name, 
      fullName: name,
      value, 
      percentage: ((value / totalAlumni) * 100).toFixed(1),
      totalAlumni
    }));

  // Handle empty data case
  if (departmentData.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-blue-50 to-blue-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent font-bold">
              Department Distribution
            </span>
          </CardTitle>
          <p className="text-gray-600 mt-2">Alumni distribution across different departments</p>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full flex items-center justify-center">
            <p className="text-gray-500 text-center">
              No department data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-blue-50 to-blue-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3 text-xl">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Building className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent font-bold">
            Department Distribution
          </span>
        </CardTitle>
        <p className="text-gray-600 mt-2">Alumni distribution across different departments</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 mb-4">Department Breakdown</h4>
            {departmentData.map((dept, index) => (
              <div key={dept.fullName} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{dept.fullName}</p>
                    <p className="text-xs text-gray-600">{dept.percentage}% of alumni</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-gray-50">
                  {dept.value}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentDistributionChart;