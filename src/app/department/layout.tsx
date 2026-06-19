"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";

export default function DepartmentRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="department">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
