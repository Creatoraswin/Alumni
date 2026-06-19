"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Student } from "@/services/apiService";
import { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface StudentStatusProps {
  student: Student;
}

const StudentStatus = ({ student }: StudentStatusProps) => {
  // Determine student status based on currentjob field
  const getStatus = (): { label: string; variant: BadgeVariant } => {
    const jobStatus = typeof student.currentjob === "string" ? student.currentjob.trim().toLowerCase() : "";
    
    if (jobStatus === "job") {
      return { label: "Employed", variant: "default" };
    } else if (jobStatus === "higher study" || jobStatus === "higher studies") {
      return { label: "Higher Studies", variant: "secondary" };
    } else {
      return { label: "Not Placed", variant: "destructive" };
    }
  };

  const status = getStatus();

  return (
    <div className="mt-2">
      <Badge variant={status.variant}>
        {status.label}
      </Badge>
    </div>
  );
};

export default StudentStatus;