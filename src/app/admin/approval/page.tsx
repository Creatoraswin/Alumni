"use client";

import React from "react";
import ApprovalTab from "@/components/ApprovalTab";
import { useAdminData } from "@/components/AdminLayout";

export default function AdminApprovalPage() {
  const { allStudents, setStudents } = useAdminData();
  return (
    <ApprovalTab
      userRole="admin"
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
