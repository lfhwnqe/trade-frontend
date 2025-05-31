"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  hour: string;
  minute: string;
  second: string;
  onTimeChange: (type: "hour" | "minute" | "second", value: string) => void;
  showSeconds?: boolean;
}

export function TimePickerComponent({
  hour,
  minute,
  second,
  onTimeChange,
  showSeconds = true,
}: TimePickerProps) {
  // 生成时间选项
  const generateTimeOptions = (max: number) => {
    return Array.from({ length: max }, (_, i) => {
      const value = i.toString().padStart(2, "0");
      return (
        <SelectItem key={value} value={value}>
          {value}
        </SelectItem>
      );
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">时间</span>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={hour}
          onValueChange={(value) => onTimeChange("hour", value)}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue placeholder="时" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto">
            {generateTimeOptions(24)}
          </SelectContent>
        </Select>
        <span>:</span>
        <Select
          value={minute}
          onValueChange={(value) => onTimeChange("minute", value)}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue placeholder="分" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto">
            {generateTimeOptions(60)}
          </SelectContent>
        </Select>
        {showSeconds && (
          <>
            <span>:</span>
            <Select
              value={second}
              onValueChange={(value) => onTimeChange("second", value)}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="秒" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {generateTimeOptions(60)}
              </SelectContent>
            </Select>
          </>
        )}
      </div>
    </div>
  );
}
