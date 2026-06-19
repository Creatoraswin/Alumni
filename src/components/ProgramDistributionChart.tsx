"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building } from "lucide-react";
import { Student } from "@/services/apiService";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface ProgramDistributionChartProps {
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

const ProgramDistributionChart = ({ students }: ProgramDistributionChartProps) => {
  const totalAlumni = students.length;
  const programStats = students.reduce((acc, student) => {
    acc[student.programme] = (acc[student.programme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const programData = Object.entries(programStats)
    .sort(([,a], [,b]) => b - a)
    .map(([name, value]) => ({ 
      name: name.length > 30 ? name.substring(0, 30) + '...' : name, 
      fullName: name,
      value, 
      percentage: ((value / totalAlumni) * 100).toFixed(1),
      totalAlumni
    }));

  // Handle empty data case
  if (programData.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-blue-50 to-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent font-bold">
              Program Distribution
            </span>
          </CardTitle>
          <p className="text-gray-600 mt-1">Alumni distribution across different programs</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            <p className="text-gray-500 text-center">
              No program data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-blue-50 to-blue-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-3 text-xl">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Building className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent font-bold">
            Program Distribution
          </span>
        </CardTitle>
        <p className="text-gray-600 mt-1">Alumni distribution across different programs</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={programData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={65}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {programData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-gray-800 mb-1">Program Breakdown</h4>
            {programData.map((prog, index) => (
              <div key={prog.fullName} className="flex items-center justify-between p-1 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-gray-900 whitespace-normal break-words">{prog.fullName}</p>
                    <p className="text-xs text-gray-600">{prog.percentage}% of alumni</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-gray-50 text-xs px-2 py-1">
                  {prog.value}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgramDistributionChart;