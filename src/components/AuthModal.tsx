"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Shield, Loader2, UserCog, Building2, Eye, EyeOff, Calendar } from "lucide-react";
import { authenticateStudent, authenticateDepartmentUser, Student } from "@/services/apiService";
import { DepartmentUser } from "@/contexts/AuthContext";
import { UserRole } from "@/contexts/auth-context";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: "student" | "admin" | "department" | "school" | "alumni-manager" | "cadmin", student?: Student, departmentUser?: DepartmentUser) => void;
}

const AuthModal = ({ isOpen, onClose, onLogin }: AuthModalProps) => {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"student" | "department">("student");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  // Extract school from email to determine gradient
  const getSchoolFromEmail = (email: string) => {
    if (email.includes("soa")) return "soa";
    if (email.includes("iter")) return "iter";
    if (email.includes("ims")) return "ims";
    if (email.includes("cutmap")) return "cutmap";
    return "default";
  };

  const getGradientClass = (school: string) => {
    switch (school) {
      case "soa":
        return "bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500";
      case "iter":
        return "bg-gradient-to-br from-green-500 via-teal-600 to-blue-500";
      case "ims":
        return "bg-gradient-to-br from-orange-500 via-red-600 to-purple-500";
      case "cutmap":
        return "bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500";
      default:
        return "bg-gradient-to-br from-gray-500 via-slate-600 to-gray-700";
    }
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    
    try {
      if (loginType === "student") {
        // Try student authentication (using DOB as password)
        const student = await authenticateStudent(email, password);
        if (student) {
          onLogin("student", student);
          // Redirect to directory after successful login
          router.push('/alumni-directory');
          onClose();
        } else {
          setError("Invalid credentials. Please check your email and date of birth.");
        }
      } else if (loginType === "department") {
        // Try department/admin/school/alumni-manager/cadmin authentication
        const result = await authenticateDepartmentUser(username, password);
        if (result.success && result.user) {
          // Ensure the role is a valid non-student role for DepartmentUser
          const validDepartmentRoles = ["admin", "department", "school", "alumni-manager", "cadmin"] as const;
          type DepartmentRole = typeof validDepartmentRoles[number];
          
          const userRole = result.user.role;
          
          if (!validDepartmentRoles.includes(userRole as DepartmentRole)) {
            throw new Error('Invalid user role for department user');
          }

          // Create the department user with the properly typed role
          const typedUser: DepartmentUser = {
            ...result.user,
            role: userRole as DepartmentRole
          };

          // Ensure we're passing a valid UserRole to onLogin
          const loginRole = userRole as UserRole;
          onLogin(loginRole, undefined, typedUser);
          
          // Navigate based on role
          if (userRole === "admin") {
            router.push('/admin');
          } else if (userRole === "cadmin") {
            router.push('/cadmin');
          } else if (userRole === "department") {
            router.push('/department');
          } else if (userRole === "school") {
            router.push('/school');
          } else if (userRole === "alumni-manager") {
            router.push('/alumni-manager');
          }
          onClose();
        } else {
          setError(result.message || "Invalid username or password.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLoginType("student");
    setEmail("");
    setUsername("");
    setPassword("");
    setError("");
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue);
    
    if (dateValue) {
      const date = new Date(dateValue);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      setPassword(`${dd}/${mm}/${yyyy}`);
    }
  };

  // Add keyboard event handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  const handleSetToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setPassword(`${dd}/${mm}/${yyyy}`);
  };

  const currentSchool = getSchoolFromEmail(email);
  const gradientClass = getGradientClass(currentSchool);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md mx-4 w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto rounded-xl border-0 shadow-elegant p-2">
        {/* Enhanced gradient header based on school */}
        <div className="h-8 gradient-hero relative overflow-hidden rounded-lg -mx-2 -mt-2 mb-2">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        </div>

        <DialogHeader className="-mt-0.5 mb-0.5 text-center">
          <DialogTitle className="flex items-center justify-center space-x-1.5 text-sm md:text-base">
            <div className="p-1 gradient-primary rounded-md shadow-glow">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-gradient-primary font-bold">Alumni Portal</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground text-center">
            Sign in to access your profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-2">
          {/* Login Type Selector - Enhanced with better colors */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Login Type</Label>
            <Select value={loginType} onValueChange={(value: "student" | "department") => setLoginType(value)}>
              <SelectTrigger className="input-enhanced focus-enhanced text-xs h-9 border-2 border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/10">
                <SelectValue placeholder="Select login type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-primary/20">
                <SelectItem value="student" className="hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/15 focus:to-secondary/10 cursor-pointer transition-all duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Alumni Login</span>
                  </div>
                </SelectItem>
                <SelectItem value="department" className="hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/15 focus:to-secondary/10 cursor-pointer transition-all duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Department/Admin Login</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Form Fields */}
          {loginType === "student" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@cutmap.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input-enhanced focus-enhanced text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">Date of Birth</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="dd/mm/yyyy"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="input-enhanced focus-enhanced text-xs h-9 pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center px-1.5 text-muted-foreground hover:text-primary transition-colors border-r border-muted-foreground/30"
                        title="Select date"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                      </button>
                      {showDatePicker && (
                        <div className="absolute right-0 mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5">
                          <div className="flex justify-between items-center mb-1">
                            <button 
                              onClick={handleSetToday}
                              className="text-xs bg-primary text-white px-1 py-0.5 rounded"
                            >
                              Today
                            </button>
                            <button 
                              onClick={() => setShowDatePicker(false)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Close
                            </button>
                          </div>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            className="text-xs border rounded p-1"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="flex items-center px-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-foreground">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input-enhanced focus-enhanced text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="input-enhanced focus-enhanced text-xs h-9 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </>
          )}
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive p-2 rounded-lg text-xs">
              {error}
            </div>
          )}
          
          <div className="gradient-card border border-primary/20 p-2 rounded-lg text-xs space-y-1 shadow-soft">
            <div className="flex items-center font-semibold text-primary">
              <Shield className="h-4 w-4 mr-2" />
              Login Instructions:
            </div>
            <div className="space-y-1 text-foreground">
              {loginType === "student" ? (
                <p><strong>Students:</strong> Use your email and <span className="font-bold">date of birth (dd/mm/yyyy)</span> as password.</p>
              ) : (
                <p className="text-xs">
                  For login credentials, contact the IT Department.
                </p>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleLogin}
            className="w-full text-xs btn-primary h-9 rounded-md font-semibold"
            disabled={loading || (loginType === "student" ? (!email || !password) : (!username || !password))}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          
          {/* Sign Up prompt for new users */}
          <div className="gradient-secondary border border-secondary/30 rounded-lg p-2 text-center shadow-soft">
            <span className="text-dark font-semibold text-xs">Not registered yet?</span>
            <a
              href="/SignUp"
              className="ml-2 inline-block gradient-primary text-white font-semibold text-xs py-1 px-3 rounded-lg hover:scale-105 transition-all shadow-glow"
            >
              Sign Up
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;