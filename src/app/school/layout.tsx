"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";

export default function SchoolRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="school">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
