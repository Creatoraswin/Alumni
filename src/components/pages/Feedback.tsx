"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Search, MessageSquare, ThumbsUp, ThumbsDown, TrendingUp } from "lucide-react";
import { useAdminData } from "@/components/AdminLayout";
import FilterSection from "@/components/FilterSection";
// Custom word cloud component compatible with React 19 (react-wordcloud only supports up to React 16)
const WORD_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#2563eb', '#7c3aed',
];

interface WordItem {
  text: string;
  value: number;
}

const SimpleWordCloud: React.FC<{ words: WordItem[] }> = ({ words }) => {
  if (!words || words.length === 0) return null;

  const maxValue = Math.max(...words.map(w => w.value));
  const minValue = Math.min(...words.map(w => w.value));
  const range = maxValue - minValue || 1;

  // Deterministic shuffle based on word text so layout is stable
  const shuffled = [...words].sort((a, b) => {
    const hashA = a.text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hashB = b.text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return hashA - hashB;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px 12px',
        padding: '16px',
        width: '100%',
      }}
    >
      {shuffled.map((word, i) => {
        const normalized = (word.value - minValue) / range;
        const fontSize = Math.round(14 + normalized * 36); // 14px to 50px
        const color = WORD_COLORS[i % WORD_COLORS.length];
        const rotation = i % 7 === 0 ? -12 : i % 5 === 0 ? 8 : 0;

        return (
          <span
            key={word.text}
            title={`${word.text}: ${word.value}`}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: normalized > 0.5 ? 700 : 500,
              color,
              lineHeight: 1.2,
              display: 'inline-block',
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease, opacity 0.3s ease',
              cursor: 'default',
              opacity: 0.85 + normalized * 0.15,
              padding: '2px 4px',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.transform = `rotate(${rotation}deg) scale(1.15)`;
              (e.target as HTMLElement).style.opacity = '1';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.transform = `rotate(${rotation}deg) scale(1)`;
              (e.target as HTMLElement).style.opacity = String(0.85 + normalized * 0.15);
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};

const Feedback = () => {
  const { students } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedProgramme, setSelectedProgramme] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");


  // Filter students - only show approved students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // First check approval status with robust checking
      if (!student.Status || typeof student.Status !== 'string') return false;
      const status = student.Status.trim().toLowerCase();
      const isApproved = status === 'approved';
      if (!isApproved) return false;

      // Apply other filters
      const matchesYear = selectedYear === "all" || student.graduationYear === selectedYear;
      const matchesSchool = selectedSchool === "all" || student.school === selectedSchool;
      const matchesProgramme = selectedProgramme === "all" || student.programme === selectedProgramme;
      const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment;

      const search = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === "" || (
        (typeof student.registrationNo === 'string' && student.registrationNo.toLowerCase().includes(search)) ||
        (typeof student.name === 'string' && student.name.toLowerCase().includes(search)) ||
        (typeof student.email === 'string' && student.email.toLowerCase().includes(search)) ||
        (typeof student.school === 'string' && student.school.toLowerCase().includes(search)) ||
        (typeof student.programme === 'string' && student.programme.toLowerCase().includes(search)) ||
        (typeof student.department === 'string' && student.department.toLowerCase().includes(search)) ||
        (typeof student.feedback === 'string' && student.feedback.toLowerCase().includes(search))
      );

      return matchesYear && matchesSchool && matchesProgramme && matchesDepartment && matchesSearch;
    });
  }, [students, searchTerm, selectedYear, selectedSchool, selectedProgramme, selectedDepartment]);

  // Prepare data for sentiment analysis
  const feedbackAnalysis = useMemo(() => {
    // Simple sentiment analysis based on keywords
    const positiveKeywords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love', 'best', 'perfect'];
    const negativeKeywords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing', 'poor', 'worst', 'dislike'];

    // Common words to filter out
    const commonWords = new Set([
      'with', 'this', 'college', 'have', 'very', 'been', 'about', 'from', 'what', 'that', 'will',
      'which', 'would', 'there', 'their', 'could', 'should', 'when', 'where', 'they', 'them',
      'these', 'those', 'than', 'then', 'into', 'over', 'after', 'before', 'under', 'above',
      'below', 'between', 'among', 'through', 'during', 'without', 'within', 'along', 'across',
      'behind', 'beyond', 'toward', 'around', 'amongst', 'against', 'towards', 'upon', 'onto',
      'into', 'throughout', 'within', 'except', 'beside', 'besides', 'despite', 'down', 'off',
      'out', 'outside', 'inside', 'up', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
      'can', 'had', 'her', 'she', 'him', 'his', 'has', 'did', 'may', 'its', 'who', 'get', 'got',
      'was', 'one', 'two', 'use', 'way', 'day', 'our', 'how', 'say', 'any', 'new', 'now', 'old',
      'see', 'two', 'boy', 'did', 'man', 'men', 'run', 'too', 'try', 'may', 'ask', 'far', 'set',
      'put', 'end', 'big', 'yet', 'lot', 'act', 'age', 'ago', 'aid', 'aim', 'air', 'arm', 'art',
      'bad', 'bag', 'bat', 'bed', 'bit', 'box', 'buy', 'car', 'cat', 'cop', 'cry', 'cup', 'cut',
      'dog', 'dry', 'due', 'eat', 'egg', 'eye', 'fan', 'fat', 'fit', 'fix', 'fly', 'fog', 'fox',
      'fun', 'gas', 'gel', 'get', 'god', 'gun', 'guy', 'hat', 'hit', 'hot', 'ice', 'ill', 'ink',
      'inn', 'jar', 'jet', 'job', 'joy', 'key', 'kid', 'lab', 'law', 'lay', 'led', 'leg', 'let',
      'lid', 'lie', 'lip', 'log', 'lot', 'low', 'map', 'mat', 'men', 'mud', 'mug', 'net', 'nod',
      'nor', 'not', 'now', 'nut', 'oak', 'oar', 'oat', 'oil', 'old', 'one', 'opt', 'orb', 'ore',
      'our', 'out', 'owl', 'own', 'pad', 'pan', 'pay', 'pen', 'pet', 'pie', 'pig', 'pin', 'pit',
      'pot', 'put', 'rag', 'rat', 'raw', 'red', 'rib', 'rim', 'rip', 'rob', 'rod', 'rot', 'row',
      'rub', 'rug', 'run', 'sad', 'sat', 'saw', 'say', 'sea', 'see', 'set', 'sew', 'she', 'shy',
      'sin', 'sit', 'six', 'ski', 'sky', 'sob', 'son', 'soy', 'spy', 'sum', 'sun', 'tab', 'tag',
      'tan', 'tap', 'tar', 'tax', 'tea', 'ten', 'the', 'tie', 'tin', 'tip', 'toe', 'ton', 'too',
      'top', 'toy', 'try', 'tub', 'two', 'use', 'van', 'vat', 'vet', 'vow', 'war', 'was', 'wax',
      'way', 'web', 'wed', 'wet', 'who', 'why', 'wig', 'win', 'wit', 'woe', 'won', 'woo', 'wow',
      'yes', 'yet', 'zip', 'zone', 'zoom', 'able', 'back', 'been', 'call', 'came', 'come', 'each',
      'find', 'first', 'four', 'from', 'good', 'hand', 'head', 'help', 'high', 'home', 'idea', 'into',
      'just', 'know', 'last', 'left', 'life', 'like', 'line', 'list', 'live', 'long', 'look', 'made',
      'make', 'many', 'more', 'most', 'move', 'much', 'must', 'name', 'need', 'next', 'only', 'open',
      'part', 'place', 'point', 'right', 'same', 'show', 'side', 'small', 'sound', 'spell', 'still',
      'such', 'take', 'tell', 'than', 'that', 'them', 'then', 'there', 'these', 'they', 'thing', 'think',
      'this', 'time', 'turn', 'very', 'want', 'water', 'well', 'went', 'were', 'what', 'when', 'where',
      'which', 'while', 'white', 'whole', 'will', 'with', 'word', 'work', 'world', 'would', 'write',
      'year', 'your', 'about', 'again', 'along', 'also', 'another', 'around', 'because', 'been',
      'before', 'being', 'below', 'between', 'both', 'came', 'come', 'could', 'does', 'down',
      'each', 'even', 'every', 'first', 'found', 'from', 'further', 'gets', 'give', 'goes',
      'going', 'good', 'great', 'group', 'hand', 'hard', 'help', 'here', 'home', 'house',
      'important', 'interest', 'keep', 'kind', 'know', 'large', 'later', 'learn', 'leave',
      'left', 'like', 'line', 'live', 'long', 'made', 'make', 'man', 'many', 'may', 'mean',
      'men', 'might', 'more', 'most', 'move', 'much', 'must', 'name', 'need', 'never',
      'new', 'next', 'number', 'off', 'old', 'once', 'one', 'only', 'open', 'order', 'other',
      'our', 'out', 'over', 'own', 'part', 'people', 'place', 'point', 'put', 'read', 'right',
      'said', 'same', 'saw', 'say', 'see', 'seem', 'she', 'should', 'show', 'side', 'small',
      'so', 'some', 'something', 'sound', 'state', 'still', 'such', 'take', 'tell', 'than',
      'that', 'the', 'them', 'then', 'there', 'these', 'they', 'thing', 'think', 'this',
      'those', 'thought', 'three', 'through', 'time', 'together', 'too', 'took', 'turn',
      'two', 'under', 'until', 'upon', 'use', 'very', 'want', 'water', 'way', 'well',
      'went', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'why', 'will',
      'with', 'without', 'word', 'work', 'world', 'would', 'write', 'year', 'you', 'young',
      'your', 'yourself', 'cutmap', 'university', 'alumni', 'student', 'students', 'program',
      'programme', 'department', 'school', 'faculty', 'course', 'courses', 'classes', 'class',
      'education', 'educational', 'learning', 'learn', 'teaching', 'teach', 'teacher', 'teachers',
      'professor', 'professors', 'academic', 'academics', 'study', 'studying', 'studies', 'research',
      'researcher', 'researchers', 'project', 'projects', 'assignment', 'assignments', 'exam', 'exams',
      'test', 'tests', 'grade', 'grades', 'grading', 'score', 'scores', 'mark', 'marks', 'grading',
      'curriculum', 'syllabus', 'subject', 'subjects', 'topic', 'topics', 'lecture', 'lectures',
      'seminar', 'seminars', 'workshop', 'workshops', 'lab', 'laboratory', 'labs', 'practical',
      'practicals', 'internship', 'internships', 'placement', 'placements', 'job', 'jobs', 'career',
      'careers', 'employment', 'employ', 'employed', 'unemployed', 'graduate', 'graduates',
      'graduation', 'graduating', 'degree', 'degrees', 'diploma', 'diplomas', 'certificate',
      'certificates', 'qualification', 'qualifications', 'skill', 'skills', 'experience',
      'experienced', 'training', 'trained', 'train', 'development', 'develop', 'developed',
      'growth', 'growing', 'improve', 'improvement', 'improved', 'better', 'best', 'good', 'great',
      'excellent', 'outstanding', 'exceptional', 'superior', 'superb', 'wonderful', 'fantastic',
      'amazing', 'incredible', 'brilliant', 'genius', 'smart', 'intelligent', 'clever', 'bright',
      'talented', 'gifted', 'capable', 'competent', 'proficient', 'skilled', 'expert', 'master',
      'professional', 'specialist', 'specialize', 'specialized', 'specialization', 'speciality',
      'field', 'fields', 'area', 'areas', 'domain', 'domains', 'sector', 'sectors', 'industry',
      'industries', 'business', 'businesses', 'company', 'companies', 'corporation', 'corporations',
      'organization', 'organizations', 'organisation', 'organisations', 'institution', 'institutions',
      'establishment', 'establishments', 'enterprise', 'enterprises', 'firm', 'firms', 'office',
      'offices', 'headquarters', 'hq', 'branch', 'branches', 'division', 'divisions', 'department',
      'departments', 'unit', 'units', 'team', 'teams', 'group', 'groups', 'committee', 'committees',
      'board', 'boards', 'council', 'councils', 'association', 'associations', 'society', 'societies',
      'club', 'clubs', 'union', 'unions', 'federation', 'federations', 'confederation', 'confederations',
      'network', 'networks', 'community', 'communities', 'culture', 'cultures', 'tradition', 'traditions', 'centurion', 'cse', 'management'
      , 'optometry', 'staff', 'universitys', 'andhra'
    ]);

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    const feedbackWords: Record<string, number> = {};
    const departmentCounts: Record<string, number> = {};

    filteredStudents.forEach(student => {
      if (!student.feedback || student.feedback === "NA") return;

      const feedback = student.feedback.toLowerCase();

      // Count sentiment
      let isPositive = false;
      let isNegative = false;

      positiveKeywords.forEach(keyword => {
        if (feedback.includes(keyword)) {
          isPositive = true;
        }
      });

      negativeKeywords.forEach(keyword => {
        if (feedback.includes(keyword)) {
          isNegative = true;
        }
      });

      // If both positive and negative, consider it mixed/neutral
      if (isPositive && isNegative) {
        neutralCount++;
      } else if (isPositive) {
        positiveCount++;
      } else if (isNegative) {
        negativeCount++;
      } else {
        neutralCount++;
      }

      // Count departments
      const department = student.department || "Unknown";
      if (department in departmentCounts) {
        departmentCounts[department]++;
      } else {
        departmentCounts[department] = 1;
      }

      // Extract words for word cloud
      const words = feedback
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/) // Split by whitespace
        .filter(word =>
          word.length > 3 && // Only words longer than 3 characters
          !commonWords.has(word) // Exclude common words
        );

      words.forEach(word => {
        if (word in feedbackWords) {
          feedbackWords[word]++;
        } else {
          feedbackWords[word] = 1;
        }
      });
    });

    // Get top words for word cloud
    const topWords = Object.entries(feedbackWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 75) // Increased from 50 to 75 words
      .map(([word, count]) => ({ word, count }));

    // Get top departments
    const topDepartments = Object.entries(departmentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([department, count]) => ({ department, count }));

    return {
      sentimentData: [
        { name: 'Positive', value: positiveCount },
        { name: 'Negative', value: negativeCount },
        { name: 'Neutral', value: neutralCount }
      ],
      sentimentBarData: [
        { name: 'Feedback Sentiment', Positive: positiveCount, Negative: negativeCount, Neutral: neutralCount }
      ],
      topWords,
      topDepartments
    };
  }, [filteredStudents]);

  // Prepare data for charts
  const departmentFeedbackData = useMemo(() => {
    const departmentData: Record<string, { count: number; positive: number; negative: number; neutral: number }> = {};

    filteredStudents.forEach(student => {
      if (!student.feedback || student.feedback === "NA") return;

      const department = student.department || "Unknown";
      if (!(department in departmentData)) {
        departmentData[department] = { count: 0, positive: 0, negative: 0, neutral: 0 };
      }

      departmentData[department].count++;

      // Simple sentiment analysis
      const feedback = student.feedback.toLowerCase();
      const positiveKeywords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love', 'best', 'perfect'];
      const negativeKeywords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing', 'poor', 'worst', 'dislike'];

      let isPositive = false;
      let isNegative = false;

      positiveKeywords.forEach(keyword => {
        if (feedback.includes(keyword)) {
          isPositive = true;
        }
      });

      negativeKeywords.forEach(keyword => {
        if (feedback.includes(keyword)) {
          isNegative = true;
        }
      });

      if (isPositive && isNegative) {
        departmentData[department].neutral++;
      } else if (isPositive) {
        departmentData[department].positive++;
      } else if (isNegative) {
        departmentData[department].negative++;
      } else {
        departmentData[department].neutral++;
      }
    });

    return Object.entries(departmentData).map(([department, data]) => ({
      department,
      count: data.count,
      positive: data.positive,
      negative: data.negative,
      neutral: data.neutral
    }));
  }, [filteredStudents]);

  const COLORS = ['#10B981', '#EF4444', '#94A3B8'];

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedYear("all");
    setSelectedSchool("all");
    setSelectedProgramme("all");
    setSelectedDepartment("all");
  };

  return (
    <div className="space-y-6">
      {/* Add CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>

      <div className="bg-card p-4 md:p-6 rounded-xl shadow-lg border border-border">
        <div className="flex items-center space-x-3 mb-4 md:mb-6">
          <div className="p-2 bg-primary rounded-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Alumni Feedback Analytics
          </h2>
        </div>

        <div className="text-xs md:text-sm text-muted-foreground bg-secondary px-3 md:px-4 py-2 rounded-lg">
          Analyze feedback from alumni about their university experience
        </div>
      </div>

      {/* Filters */}
      <Card className="hidden sm:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <span className="text-base md:text-lg">Filter Feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FilterSection
            students={students}
            filteredStudents={filteredStudents}
            selectedYear={selectedYear}
            selectedSchool={selectedSchool}
            selectedProgramme={selectedProgramme}
            selectedDepartment={selectedDepartment}
            searchTerm={searchTerm}
            onYearChange={setSelectedYear}
            onSchoolChange={setSelectedSchool}
            onProgrammeChange={setSelectedProgramme}
            onDepartmentChange={setSelectedDepartment}
            onSearchChange={setSearchTerm}
            onClearFilters={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Feedback</p>
                <h3 className="text-xl md:text-2xl font-bold">{filteredStudents.length}</h3>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                <MessageSquare className="h-5 md:h-6 w-5 md:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Positive Sentiment</p>
                <h3 className="text-xl md:text-2xl font-bold">
                  {feedbackAnalysis.sentimentData.find(d => d.name === 'Positive')?.value || 0}
                </h3>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-full">
                <ThumbsUp className="h-5 md:h-6 w-5 md:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Negative Sentiment</p>
                <h3 className="text-xl md:text-2xl font-bold">
                  {feedbackAnalysis.sentimentData.find(d => d.name === 'Negative')?.value || 0}
                </h3>
              </div>
              <div className="p-2 md:p-3 bg-red-100 rounded-full">
                <ThumbsDown className="h-5 md:h-6 w-5 md:w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Top Departments By Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {feedbackAnalysis.topDepartments.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm md:text-base font-medium capitalize">{dept.department}</span>
                  <Badge variant="secondary" className="text-xs md:text-sm">{dept.count} feedbacks</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Feedback Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={feedbackAnalysis.sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {feedbackAnalysis.sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department-wise Feedback Analysis - Simple Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Department-wise Feedback Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Department Name</th>
                  <th className="text-right pb-2">Positive (%)</th>
                  <th className="text-right pb-2">Negative (%)</th>
                  <th className="text-right pb-2">Neutral (%)</th>
                </tr>
              </thead>
              <tbody>
                {departmentFeedbackData
                  .sort((a, b) => b.count - a.count) // Sort by total count descending
                  .map((dept, index) => {
                    // Calculate total based on sentiment counts (students with feedback only)
                    const totalWithFeedback = dept.positive + dept.negative + dept.neutral;
                    const positivePercent = totalWithFeedback > 0 ? Math.round((dept.positive / totalWithFeedback) * 100) : 0;
                    const negativePercent = totalWithFeedback > 0 ? Math.round((dept.negative / totalWithFeedback) * 100) : 0;
                    const neutralPercent = totalWithFeedback > 0 ? Math.round((dept.neutral / totalWithFeedback) * 100) : 0;

                    return (
                      <tr key={index} className="border-b hover:bg-secondary/50">
                        <td className="py-3 capitalize">{dept.department}</td>
                        <td className="py-3 text-right text-green-600 font-medium">{positivePercent}%</td>
                        <td className="py-3 text-right text-red-600 font-medium">{negativePercent}%</td>
                        <td className="py-3 text-right text-gray-600 font-medium">{neutralPercent}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Words in Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Most Common Words in Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 md:p-6 min-h-[300px] md:min-h-[400px] flex items-center justify-center bg-gradient-to-br from-secondary/20 to-accent/20 rounded-lg border border-border relative overflow-hidden w-full">
            {feedbackAnalysis.topWords && feedbackAnalysis.topWords.length > 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <SimpleWordCloud
                  words={feedbackAnalysis.topWords.map(wordObj => ({
                    text: wordObj.word,
                    value: wordObj.count
                  }))}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No words to display</p>
                <p className="text-sm mt-2">Try adjusting the filters to see feedback data</p>
              </div>
            )}
            {/* Debug information */}
            {feedbackAnalysis.topWords && feedbackAnalysis.topWords.length > 0 && (
              <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-white/80 px-2 py-1 rounded">
                {/* Showing {feedbackAnalysis.topWords.length} words */}
                {/* keywords */}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback List - Hidden as per user request */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Feedback Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No feedback available matching the current filters.
              </p>
            ) : (
              filteredStudents.map((student, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {student.school} • {student.department} • {student.programme}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-secondary rounded-lg">
                    <p className="italic">"{student.feedback}"</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default Feedback;