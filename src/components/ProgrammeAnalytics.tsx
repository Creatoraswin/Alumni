"use client";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";
import { Student } from "@/services/apiService";

interface ProgrammeAnalyticsProps {
  students: Student[];
}

const ProgrammeAnalytics = ({ students }: ProgrammeAnalyticsProps) => {
  const totalAlumni = students.length;
  
  const programmeStats = students.reduce((acc, student) => {
    acc[student.programme] = (acc[student.programme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center space-x-3 text-2xl">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent font-bold">
            Programme Analytics - Visual Overview
          </span>
        </CardTitle>
        <p className="text-gray-600 mt-2">Easy-to-identify programme distribution with visual indicators</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(programmeStats)
            .sort(([,a], [,b]) => b - a)
            .map(([programme, count], index) => {
              const percentage = ((count / totalAlumni) * 100).toFixed(1);
              const maxCount = Math.max(...Object.values(programmeStats));
              const barWidth = (count / maxCount) * 100;
              
              return (
                <div key={programme} className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-indigo-300 transform hover:-translate-y-1">
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm border border-white" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-800">{count}</span>
                      <p className="text-xs text-gray-500">alumni</p>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">{programme}</h4>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${barWidth}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-indigo-600">{percentage}%</span>
                    <Badge 
                      variant={index < 3 ? "default" : "outline"}
                      className={`text-xs ${index < 3 ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600'}`}
                    >
                      {index < 3 ? 'Top' : 'Other'}
                    </Badge>
                  </div>
                </div>
              );
            })}
        </div>
        
        <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-600">{Object.keys(programmeStats).length}</p>
              <p className="text-sm text-gray-600">Total Programmes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {Object.entries(programmeStats).sort(([,a], [,b]) => b - a)[0]?.[1] || 0}
              </p>
              <p className="text-sm text-gray-600">Highest Count</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {(Object.values(programmeStats).reduce((a, b) => a + b, 0) / Object.keys(programmeStats).length).toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Average per Programme</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {Object.entries(programmeStats).filter(([,count]) => count >= 5).length}
              </p>
              <p className="text-sm text-gray-600">Programmes with 5+ Alumni</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgrammeAnalytics;
