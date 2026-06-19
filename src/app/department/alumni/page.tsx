"use client";

import React from "react";
import DepatmentAlumniManagementTab from "@/components/DepatmentAlumniManagementTab";
import { useAdminData } from "@/components/AdminLayout";

export default function DepartmentAlumniPage() {
  const { students, setStudents } = useAdminData();
  return (
    <DepatmentAlumniManagementTab
      userRole="department"
      students={students}
      onStudentUpdate={(updatedStudent) =>
        setStudents((prev) =>
          prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
        )
      }
    />
  );
}
