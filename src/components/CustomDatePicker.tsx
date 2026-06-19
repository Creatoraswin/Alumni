"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { formatDateForDisplay, formatDateForInput } from "@/lib/dateUtils";

interface CustomDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CustomDatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Pick a date",
  disabled = false
}: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Format date as DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      onChange(formattedDate);
      setIsOpen(false);
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Validate that it's a valid date format
    if (inputValue.match(/^\d{4}-\d{2}-\d{2}$/) || inputValue === "") {
      if (inputValue === "") {
        onChange("");
      } else {
        // Convert YYYY-MM-DD to DD/MM/YYYY
        const [year, month, day] = inputValue.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        onChange(formattedDate);
      }
    }
  };

  const handleSetToday = () => {
    const today = new Date();
    // Format today's date as DD/MM/YYYY
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDateForDisplay(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b border-border">
          <input
            type="date"
            value={formatDateForInput(value)}
            onChange={handleManualInput}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <Calendar
          mode="single"
          selected={value ? new Date(formatDateForInput(value)) : undefined}
          onSelect={handleDateSelect}
        />
        <div className="p-3 border-t border-border">
          <Button 
            variant="outline" 
            onClick={handleSetToday}
            className="w-full"
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CustomDatePicker;