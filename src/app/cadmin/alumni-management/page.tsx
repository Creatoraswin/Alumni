"use client";

import React from "react";
import AlumniManagementTab from "@/components/AlumniManagementTab";
import { useAdminData } from "@/components/AdminLayout";

export default function CadminAlumniManagementPage() {
  const { students, setStudents } = useAdminData();
  return (
    <AlumniManagementTab
      userRole="cadmin"
      students={students}
      onStudentUpdate={(updatedStudent) =>
        setStudents((prev) =>
          prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
        )
      }
    />
  );
}
