"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";

export default function AlumniManagerRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="alumni-manager">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
