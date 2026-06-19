"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";

export default function CadminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="cadmin">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
