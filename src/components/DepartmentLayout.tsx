"use client";

import React from "react";
import DepartmentPanel from "./DepartmentPanel";

const DepartmentLayout = ({ departmentName }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Layout container */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{departmentName}</h1>
        </header>

        {/* Main content */}
        <main className="grid grid-cols-1 gap-8">
          {/* Department panel */}
          <DepartmentPanel />
          
          {/* Additional content areas can be added here */}
          {/* Sidebar */}
          <div className="bg-white p-6 rounded-lg shadow">
            {/* Sidebar content */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DepartmentLayout;
