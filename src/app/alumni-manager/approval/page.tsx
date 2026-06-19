"use client";

import React from "react";
import ApprovalTab from "@/components/ApprovalTab";
import { useAdminData } from "@/components/AdminLayout";

export default function AlumniManagerApprovalPage() {
  const { allStudents, setStudents } = useAdminData();
  return (
    <ApprovalTab
      userRole="alumni-manager"
      students={allStudents}
      onStudentUpdate={(updatedStudent) =>
        setStudents((prev) =>
          prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
        )
      }
      currentStudent={null}
    />
  );
}
