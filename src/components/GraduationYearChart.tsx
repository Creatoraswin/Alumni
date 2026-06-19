"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { Student } from "@/services/apiService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

interface GraduationYearChartProps {
  students: Student[];
}

// Define types for tooltip and label props
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      year: string;
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

const GraduationYearChart = ({ students }: GraduationYearChartProps) => {
  const totalAlumni = students.length;
  
  const yearStats = students.reduce((acc, student) => {
    acc[student.graduationYear] = (acc[student.graduationYear] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const yearData = Object.entries(yearStats).map(([name, value]) => ({ 
    name: `${name}`, 
    value, 
    year: name 
  }));

  // Handle empty data case
  if (yearData.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-green-50 to-green-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent font-bold">
              Graduation Year Trends
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full flex items-center justify-center">
            <p className="text-gray-500 text-center">
              No graduation year data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].payload.year}</p>
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
        fontSize={12}
        fontWeight="600"
      >
        {value}
      </text>
    );
  };

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-green-50 to-green-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3 text-xl">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent font-bold">
            Graduation Year Trends
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearData.sort((a, b) => a.year.localeCompare(b.year))} margin={{ top: 30, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                fontSize={12}
              />
              <YAxis stroke="#64748b" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" content={renderBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GraduationYearChart;