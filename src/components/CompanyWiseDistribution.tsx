"use client";


import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Student } from "@/services/apiService";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompanyWiseDistributionProps {
  students: Student[];
}

const EXCLUDE_ROLE_VALUES = ["", "na", "not specified", "null", "nil", "no"];

const CompanyWiseDistribution = ({ students }: CompanyWiseDistributionProps) => {
  // Only include students whose currentPosition is 'Job'
  const jobStudents = students.filter(s => s.currentDesignation && s.designation && s.designation.toLowerCase() !== "na" && s.designation.toLowerCase() !== "NA");
  // Group alumni by company and collect roles
  const companyMap: Record<string, { count: number; roles: string[] }> = {};
  jobStudents.forEach(student => {
    const company = student.organisation?.trim() || "NA";
    if (company && company !== "NA") {
      if (!companyMap[company]) {
        companyMap[company] = { count: 0, roles: [] };
      }
      companyMap[company].count += 1;
      // Use designation instead of currentPosition
      const designation = (student.designation || "").trim();
      if (
        designation &&
        !EXCLUDE_ROLE_VALUES.includes(designation.toLowerCase()) &&
        !companyMap[company].roles.includes(designation)
      ) {
        companyMap[company].roles.push(designation);
      }
    }
  });

  // Convert to array and sort by count descending
  const sortedCompanies = Object.entries(companyMap).sort((a, b) => b[1].count - a[1].count);

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4 px-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
        <CardTitle className="flex items-center space-x-2 text-lg md:text-2xl text-white">
          <Info className="h-5 w-5 md:h-7 md:w-7 text-white opacity-80" />
          <span className="font-bold">Company-wise Alumni Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 md:px-4">
        <div className="overflow-x-auto">
          <Table className="min-w-[400px] w-full text-xs md:text-sm">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="px-2 md:px-4 py-2 text-left break-words">Company</TableHead>
                <TableHead className="px-2 md:px-4 py-2 text-left break-words">Alumni Count</TableHead>
                <TableHead className="px-2 md:px-4 py-2 text-left break-words">Designations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map(([company, { count, roles }]) => (
                <TableRow key={company} className="hover:bg-blue-50">
                  <TableCell className="border-t px-2 md:px-4 py-2 font-semibold text-blue-800 break-words">{company}</TableCell>
                  <TableCell className="border-t px-2 md:px-4 py-2 text-center">
                    <Badge className="bg-blue-100 text-blue-800 font-bold px-2 md:px-3 py-1 text-xs md:text-sm">{count}</Badge>
                  </TableCell>
                  <TableCell className="border-t px-2 md:px-4 py-2">
                    {roles.length === 0 ? (
                      <span className="text-gray-400 italic break-words">No designations listed</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {roles.map(role => (
                          <Badge key={role} className="bg-purple-100 text-purple-800 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full break-words">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sortedCompanies.length === 0 && (
            <div className="text-gray-500 text-center py-8 flex flex-col items-center">
              <Info className="h-10 w-10 mb-2 text-gray-400" />
              <span>No company data available.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyWiseDistribution;
