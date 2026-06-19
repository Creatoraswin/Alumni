"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBar } from "lucide-react";
import { Student } from "@/services/apiService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";

interface DepartmentChartProps {
  students: Student[];
}

// Define types for tooltip and label props
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      fullName: string;
    };
    value: number;
  }>;
}

interface LabelProps {
  x: number;
  y: number;
  width: number;
  value: number;
}

const DepartmentChart = ({ students }: DepartmentChartProps) => {
  const totalAlumni = students.length;
  
  const departmentStats = students.reduce((acc, student) => {
    if (typeof student.programme === 'string' && student.programme.trim() !== '') {
      acc[student.programme.trim()] = (acc[student.programme.trim()] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Show ALL departments, sorted by count
  const departmentData = Object.entries(departmentStats)
    .sort(([,a], [,b]) => b - a)
    .map(([name, value]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
      value, 
      fullName: name 
    }));

  // Handle empty data case
  if (departmentData.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-purple-50 to-purple-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <ChartBar className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-700 to-purple-900 bg-clip-text text-transparent font-bold">
              All Departments Distribution
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 md:h-[500px] w-full flex items-center justify-center">
            <p className="text-gray-500 text-center">
              No department data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CHART_COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", 
    "#84CC16", "#F97316", "#EC4899", "#6366F1", "#14B8A6", "#F59E0B",
    "#DC2626", "#7C3AED", "#059669", "#D97706", "#BE185D", "#4338CA"
  ];

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].payload.fullName}</p>
          <p className="text-blue-600">
            Count: <span className="font-bold">{payload[0].value}</span>
          </p>
          <p className="text-gray-600 text-sm">
            {((payload[0].value / totalAlumni) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const renderBarLabel = (props: LabelProps) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#374151"
        textAnchor="middle"
        fontSize={10}
        fontWeight="600"
      >
        {value}
      </text>
    );
  };

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-purple-50 to-purple-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3 text-xl">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
            <ChartBar className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-700 to-purple-900 bg-clip-text text-transparent font-bold">
            All Departments Distribution
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 md:h-[500px] w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={departmentData} 
              margin={{ top: 30, right: 20, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                fontSize={10}
                tick={{ fontSize: 10 }}
              />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" content={renderBarLabel} />
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Department Legend for mobile */}
        <div className="mt-4 block md:hidden">
          <h4 className="text-sm font-semibold mb-2">Departments</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {departmentData.map((dept, index) => (
              <div key={dept.fullName} className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="truncate">{dept.fullName}: {dept.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentChart;