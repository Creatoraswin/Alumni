"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Building, Users, Briefcase, CheckCircle, XCircle, GraduationCap } from "lucide-react";
import { useAdminData } from "@/components/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from "recharts";
import { fetchStudentStrengthData, fetchStudentsData } from "@/services/apiService";
import { StudentStrength } from "@/services/apiService";
import { analyticsDataCache } from "@/services/analyticsDataCache";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DetailedAnalytics = () => {
  const { students } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [studentStrengthData, setStudentStrengthData] = useState<StudentStrength[]>([]);
  const [alumniFormData, setAlumniFormData] = useState<any[]>([]); // Form Responses 1 data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch both datasets using cached data for improved performance
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Always use cached data - it's preloaded on app start
        // If for some reason cache is empty, this will trigger a background refresh
        const data = await analyticsDataCache.getData();

        console.log('Using cached student strength and alumni form data');
        console.log('Total student strength records:', data.studentStrength.length);
        console.log('Sample student strength data:', data.studentStrength.slice(0, 3));

        // Extract and log all unique passout years
        const allYears = Array.from(new Set(data.studentStrength.map(s => s.passout).filter(Boolean))).sort();
        console.log('All unique passout years found:', allYears);

        setStudentStrengthData(data.studentStrength);
        setAlumniFormData(data.alumniForm);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform student strength data to match the existing structure
  const transformedStudentStrengthData = useMemo(() => {
    return studentStrengthData
      .filter(item => item["Registration No."] && item["Registration No."].toString().trim() !== "")
      .map(item => ({
        registrationNo: item["Registration No."] ? item["Registration No."].toString().trim() : "",
        school: item["Program"], // Mapping Program to school
        department: item["Branch"], // Mapping Branch to department
        programme: item["Program"], // Keeping Program as programme
        passout: item["passout"], // Adding passout year
        name: item["Name of the Student"], // Adding student name
        batch: item["Batch"] // Adding batch
      }))
      .filter(item => selectedYear === "all" || item.passout === selectedYear);
  }, [studentStrengthData, selectedYear]);

  // Get unique programmes and departments for filters
  const uniqueProgrammes = useMemo(() => {
    const programmes = new Set(transformedStudentStrengthData.map(student => student.programme).filter(Boolean));
    return Array.from(programmes).sort();
  }, [transformedStudentStrengthData]);

  const uniqueDepartments = useMemo(() => {
    const departments = new Set(transformedStudentStrengthData.map(student => student.department).filter(Boolean));
    return Array.from(departments).sort();
  }, [transformedStudentStrengthData]);

  // Compare student strength data with alumni form data
  const comparisonData = useMemo(() => {
    // Debug: Log the data for troubleshooting
    console.log('Student Strength Data Sample:', transformedStudentStrengthData.slice(0, 3));
    console.log('Alumni Form Data Sample:', alumniFormData.slice(0, 3));

    // Get all registration numbers from alumni form data with normalization
    const alumniRegistrations = new Set(
      alumniFormData
        .filter(student => student.registrationNo && student.registrationNo.toString().trim() !== "")
        .map(student => {
          // Normalize registration number
          return String(student.registrationNo).trim();
        })
    );

    // Debug: Log the registration numbers
    console.log('Alumni Registration Numbers (first 10):', Array.from(alumniRegistrations).slice(0, 10));
    console.log('Student Strength Registration Numbers (first 10):',
      transformedStudentStrengthData.slice(0, 10).map(s => {
        return String(s.registrationNo).trim();
      }));

    // Compare with student strength data using normalized registration numbers
    const registeredInAlumni = transformedStudentStrengthData.filter(student => {
      const normalizedRegNo = String(student.registrationNo).trim();
      const hasMatch = alumniRegistrations.has(normalizedRegNo);
      if (hasMatch) {
        console.log(`Match found: ${normalizedRegNo}`);
      }
      return hasMatch;
    });

    const notRegisteredInAlumni = transformedStudentStrengthData.filter(student => {
      const normalizedRegNo = String(student.registrationNo).trim();
      const hasMatch = alumniRegistrations.has(normalizedRegNo);
      if (!hasMatch) {
        console.log(`No match for: ${normalizedRegNo}`);
        // Also check for partial matches to help with debugging
        const partialMatches = Array.from(alumniRegistrations).filter(alumniRegNo =>
          alumniRegNo.includes(normalizedRegNo) || normalizedRegNo.includes(alumniRegNo)
        );
        if (partialMatches.length > 0) {
          console.log(`Potential partial matches for ${normalizedRegNo}:`, partialMatches);
        }
      }
      return !hasMatch;
    });

    // Debug: Log the results
    console.log(`Matched: ${registeredInAlumni.length}, Not Matched: ${notRegisteredInAlumni.length}`);

    // Find alumni who registered but are NOT in student strength database
    const studentStrengthRegNos = new Set(
      transformedStudentStrengthData.map(s => {
        return String(s.registrationNo).trim();
      })
    );

    const alumniNotInStudentStrength = alumniFormData.filter(alumni => {
      if (!alumni.registrationNo || alumni.registrationNo.toString().trim() === "") return false;

      const normalizedRegNo = String(alumni.registrationNo).trim();

      return !studentStrengthRegNos.has(normalizedRegNo);
    });

    console.log(`Alumni not in student strength database: ${alumniNotInStudentStrength.length}`);
    console.log('Sample alumni not in student strength:', alumniNotInStudentStrength.slice(0, 3));

    return {
      totalStudentStrength: transformedStudentStrengthData.length,
      registeredCount: registeredInAlumni.length,
      notRegisteredCount: notRegisteredInAlumni.length,
      registeredPercentage: ((registeredInAlumni.length / transformedStudentStrengthData.length) * 100).toFixed(1),
      notRegisteredPercentage: ((notRegisteredInAlumni.length / transformedStudentStrengthData.length) * 100).toFixed(1),
      notRegisteredDetails: notRegisteredInAlumni,
      alumniNotInStudentStrength: alumniNotInStudentStrength,
      totalAlumniRegistered: alumniFormData.filter(a => a.registrationNo && a.registrationNo.toString().trim() !== "").length
    };
  }, [alumniFormData, transformedStudentStrengthData]);

  // Prepare data for charts - Program-wise
  const programWiseData = useMemo(() => {
    // Count students by program
    const programCounts = transformedStudentStrengthData.reduce((acc, student) => {
      const program = student.programme || "Unknown";
      acc[program] = (acc[program] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get all registration numbers from alumni form data
    const alumniRegistrations = new Set(
      alumniFormData
        .filter(student => student.registrationNo && student.registrationNo.toString().trim() !== "")
        .map(student => {
          return String(student.registrationNo).trim();
        })
    );

    // Count registered students by program (those who exist in alumni form)
    const registeredByProgram = transformedStudentStrengthData.reduce((acc, student) => {
      const normalizedRegNo = String(student.registrationNo).trim();

      // Check if this student is registered in alumni form
      if (alumniRegistrations.has(normalizedRegNo)) {
        const program = student.programme || "Unknown";
        acc[program] = (acc[program] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Combine data
    return Object.keys(programCounts).map(program => ({
      name: program,
      total: programCounts[program],
      registered: registeredByProgram[program] || 0,
      notRegistered: programCounts[program] - (registeredByProgram[program] || 0)
    }));
  }, [transformedStudentStrengthData, alumniFormData]);

  // Prepare data for charts - Branch-wise
  const branchWiseData = useMemo(() => {
    // Count students by branch
    const branchCounts = transformedStudentStrengthData.reduce((acc, student) => {
      const branch = student.department || "Unknown";
      acc[branch] = (acc[branch] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get all registration numbers from alumni form data
    const alumniRegistrations = new Set(
      alumniFormData
        .filter(student => student.registrationNo && student.registrationNo.toString().trim() !== "")
        .map(student => {
          return String(student.registrationNo).trim();
        })
    );

    // Count registered students by branch (those who exist in alumni form)
    const registeredByBranch = transformedStudentStrengthData.reduce((acc, student) => {
      const normalizedRegNo = String(student.registrationNo).trim();

      // Check if this student is registered in alumni form
      if (alumniRegistrations.has(normalizedRegNo)) {
        const branch = student.department || "Unknown";
        acc[branch] = (acc[branch] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Combine data
    return Object.keys(branchCounts).map(branch => ({
      name: branch,
      total: branchCounts[branch],
      registered: registeredByBranch[branch] || 0,
      notRegistered: branchCounts[branch] - (registeredByBranch[branch] || 0)
    }));
  }, [transformedStudentStrengthData, alumniFormData]);

  // Prepare data for charts - Passout Year-wise
  const passoutYearWiseData = useMemo(() => {
    // Count students by passout year
    const yearCounts = transformedStudentStrengthData.reduce((acc, student) => {
      const year = student.passout || "Unknown";
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get all registration numbers from alumni form data
    const alumniRegistrations = new Set(
      alumniFormData
        .filter(student => student.registrationNo && student.registrationNo.toString().trim() !== "")
        .map(student => {
          return String(student.registrationNo).trim();
        })
    );

    // Count registered students by passout year (those who exist in alumni form)
    const registeredByYear = transformedStudentStrengthData.reduce((acc, student) => {
      const normalizedRegNo = String(student.registrationNo).trim();

      // Check if this student is registered in alumni form
      if (alumniRegistrations.has(normalizedRegNo)) {
        const year = student.passout || "Unknown";
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Combine data and sort by year
    return Object.keys(yearCounts)
      .map(year => ({
        name: year,
        total: yearCounts[year],
        registered: registeredByYear[year] || 0,
        notRegistered: yearCounts[year] - (registeredByYear[year] || 0)
      }))
      .sort((a, b) => {
        // Sort chronologically, put "Unknown" at the end
        if (a.name === "Unknown") return 1;
        if (b.name === "Unknown") return -1;
        return a.name.localeCompare(b.name);
      });
  }, [transformedStudentStrengthData, alumniFormData]);

  // Filter not registered details based on search and filters
  const filteredNotRegisteredDetails = useMemo(() => {
    return comparisonData.notRegisteredDetails.filter(student => {
      const matchesSearch = searchTerm === "" ||
        student.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.programme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.passout.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProgramme = selectedProgramme === "all" || student.programme === selectedProgramme;
      const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment;

      return matchesSearch && matchesProgramme && matchesDepartment;
    });
  }, [comparisonData.notRegisteredDetails, searchTerm, selectedProgramme, selectedDepartment]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedProgramme("all");
    setSelectedDepartment("all");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Loading student strength data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Detailed Analytics</h1>
          <p className="text-gray-600">Comprehensive comparison between student strength and alumni data</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="year-filter" className="text-sm font-medium">Year:</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-50 max-h-[300px] overflow-y-auto">
              <SelectItem value="all">All Years</SelectItem>
              {(() => {
                const years = Array.from(new Set(studentStrengthData.map(s => s.passout).filter(Boolean))).sort();
                console.log('Available years in dropdown:', years);
                return years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ));
              })()}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Student Strength</p>
                <p className="text-2xl font-bold">{comparisonData.totalStudentStrength}</p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registered in Alumni</p>
                <p className="text-2xl font-bold">{comparisonData.registeredCount}</p>
                <p className="text-xs text-gray-500">{comparisonData.registeredPercentage}%</p>
              </div>
              <Users className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Registered</p>
                <p className="text-2xl font-bold">{comparisonData.notRegisteredCount}</p>
                <p className="text-xs text-gray-500">{comparisonData.notRegisteredPercentage}%</p>
              </div>
              <Users className="h-10 w-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registration Rate</p>
                <p className="text-2xl font-bold">{comparisonData.registeredPercentage}%</p>
              </div>
              <Briefcase className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Row with Passout Year and Branch-wise Analysis side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passout Year-wise Chart (Duplicate for side-by-side layout) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Passout Year Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={passoutYearWiseData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="registered" name="Registered" fill="#10B981">
                    <LabelList dataKey="registered" position="top" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="notRegistered" name="Not Registered" fill="#EF4444">
                    <LabelList dataKey="notRegistered" position="top" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Program-wise Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Program-wise Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={programWiseData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="registered" name="Registered" fill="#10B981">
                    <LabelList dataKey="registered" position="top" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="notRegistered" name="Not Registered" fill="#EF4444">
                    <LabelList dataKey="notRegistered" position="top" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch-wise Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Branch-wise Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Not Registered</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {branchWiseData.length > 0 ? (
                    <>
                      {branchWiseData.map((branch, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{branch.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{branch.total}</td>
                          <td className="px-4 py-3 text-sm text-green-600">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {branch.registered}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600">
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 mr-1" />
                              {branch.notRegistered}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {branch.total > 0 ? ((branch.registered / branch.total) * 100).toFixed(1) : "0.0"}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-4 py-3 text-sm text-gray-900">TOTAL</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {branchWiseData.reduce((sum, branch) => sum + branch.total, 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {branchWiseData.reduce((sum, branch) => sum + branch.registered, 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600">
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 mr-1" />
                            {branchWiseData.reduce((sum, branch) => sum + branch.notRegistered, 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {branchWiseData.reduce((sum, branch) => sum + branch.total, 0) > 0
                              ? ((branchWiseData.reduce((sum, branch) => sum + branch.registered, 0) /
                                branchWiseData.reduce((sum, branch) => sum + branch.total, 0)) * 100).toFixed(1)
                              : "0.0"}%
                          </span>
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No branch data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Not Registered Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Not Registered Alumni Details</CardTitle>
          <p className="text-gray-600">List of students who are not yet registered in the alumni system</p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by Registration No, Name, Program..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="programme">Programme</Label>
              <Select value={selectedProgramme} onValueChange={setSelectedProgramme}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Programme" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-50">
                  <SelectItem value="all">All Programmes</SelectItem>
                  {uniqueProgrammes.map(programme => (
                    <SelectItem key={programme} value={programme}>{programme}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department">Branch</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-50">
                  <SelectItem value="all">All Branches</SelectItem>
                  {uniqueDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
          </div>

          {/* Results Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passout Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredNotRegisteredDetails.length > 0 ? (
                    filteredNotRegisteredDetails.map((student, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.registrationNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.batch}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.programme}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.department}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.passout}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Not Registered</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No records found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredNotRegisteredDetails.length} of {comparisonData.notRegisteredDetails.length} records
          </div>
        </CardContent>
      </Card>

      {/* Alumni Not in Student Strength Database Section */}
      {comparisonData.alumniNotInStudentStrength && comparisonData.alumniNotInStudentStrength.length > 0 && (
        <Card className="border-l-4 border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-yellow-500" />
              Alumni Not in Student Strength Database
            </CardTitle>
            <p className="text-gray-600">
              These alumni registered in the portal but their registration numbers don't match any records in the official student strength database.
              This explains the difference: Total Alumni ({comparisonData.totalAlumniRegistered}) - Matched Alumni ({comparisonData.registeredCount}) = {comparisonData.alumniNotInStudentStrength.length} unmatched
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Graduation Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparisonData.alumniNotInStudentStrength
                      .sort((a, b) => {
                        // Sort by graduation year chronologically
                        const yearA = a.graduationYear || 'N/A';
                        const yearB = b.graduationYear || 'N/A';

                        // Put N/A at the end
                        if (yearA === 'N/A') return 1;
                        if (yearB === 'N/A') return -1;

                        // Sort chronologically (oldest first)
                        return yearA.localeCompare(yearB);
                      })
                      .map((alumni, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-yellow-50/30"}>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{alumni.registrationNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{alumni.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{alumni.email || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{alumni.school || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{alumni.programme || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{alumni.department || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{alumni.graduationYear || 'N/A'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">
                ⚠️ Total: {comparisonData.alumniNotInStudentStrength.length} alumni with registration numbers not found in student strength database
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                These records may need verification. Possible reasons: typos in registration numbers, students from different batches not in the database, or data entry errors.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DetailedAnalytics;