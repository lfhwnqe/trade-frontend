"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePickerComponent } from "./TimePickerComponent";

interface DateCalendarPickerProps {
  analysisTime?: string;
  updateForm: (patch: { analysisTime: string }) => void;
  /** 是否显示时间选择器 */
  showTimePicker?: boolean;
  /** 是否显示秒选择器 */
  showSeconds?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 日期格式 */
  dateFormat?: string;
  /** 是否禁用交互 */
  disabled?: boolean;
}

function parseDateTime(datetime?: string) {
  if (!datetime) return { date: undefined, hour: "", minute: "", second: "" };
  const dt = new Date(datetime);
  if (isNaN(dt.getTime())) return { date: undefined, hour: "", minute: "", second: "" };
  return {
    date: dt,
    hour: dt.getHours().toString().padStart(2, "0"),
    minute: dt.getMinutes().toString().padStart(2, "0"),
    second: dt.getSeconds().toString().padStart(2, "0"),
  };
}

function toDatetimeString(date?: Date, hour?: string, minute?: string, second?: string) {
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = (hour ?? "00").padStart(2, "0");
  const mi = (minute ?? "00").padStart(2, "0");
  const ss = (second ?? "00").padStart(2, "0");
  // "YYYY-MM-DD HH:mm:ss"
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export const DateCalendarPicker: React.FC<DateCalendarPickerProps> = ({
  analysisTime,
  updateForm,
  showTimePicker = true,
  showSeconds = true,
  placeholder = "选择日期与时间",
  dateFormat = "yyyy-MM-dd",
  disabled = false,
}) => {
  const init = parseDateTime(analysisTime);
  const [date, setDate] = React.useState<Date | undefined>(init.date);
  const [hour, setHour] = React.useState(init.hour);
  const [minute, setMinute] = React.useState(init.minute);
  const [second, setSecond] = React.useState(init.second);

  // 同步外部变化（若外部传入变化则同步内部 state）
  React.useEffect(() => {
    const parsed = parseDateTime(analysisTime);
    setDate(parsed.date);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setSecond(parsed.second);
  }, [analysisTime]);

  // 任一变更都推送到 form.analysisTime
  const pushChange = React.useCallback(
    (d = date, h = hour, m = minute, s = second) => {
      if (!d) {
        updateForm({ analysisTime: "" });
        return;
      }
      updateForm({ analysisTime: toDatetimeString(d, h, m, s) });
    },
    [date, hour, minute, second, updateForm]
  );

  const onCalendarChange = (val?: Date) => {
    setDate(val);
    pushChange(val, hour, minute, second);
  };
  
  const onTimeChange = (
    type: "hour" | "minute" | "second",
    value: string
  ) => {
    if (type === "hour") setHour(value);
    if (type === "minute") setMinute(value);
    if (type === "second") setSecond(value);

    const h = type === "hour" ? value : hour;
    const m = type === "minute" ? value : minute;
    const s = type === "second" ? value : second;
    pushChange(date, h, m, s);
  };

  // 格式化显示时间
  const formatDisplayTime = () => {
    if (!date) return "";
    
    let timeStr = "";
    if (showTimePicker) {
      if (showSeconds) {
        timeStr = `${hour || "00"}:${minute || "00"}:${second || "00"}`;
      } else {
        timeStr = `${hour || "00"}:${minute || "00"}`;
      }
    }
    
    return timeStr ? `${format(date, dateFormat)} ${timeStr}` : format(date, dateFormat);
  };

  const trigger = (
    <Button
      variant={"outline"}
      className={cn(
        "justify-start text-left font-normal w-full",
        !date && "text-muted-foreground",
        "bg-muted"
      )}
      disabled={disabled}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? <span>{formatDisplayTime()}</span> : <span>{placeholder}</span>}
    </Button>
  );

  if (disabled) {
    return trigger;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col gap-4 p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onCalendarChange}
            initialFocus
          />
          {showTimePicker && (
            <TimePickerComponent
              hour={hour}
              minute={minute}
              second={second}
              onTimeChange={onTimeChange}
              showSeconds={showSeconds}
            />
          )}
          <div className="flex justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                setDate(now);
                setHour(now.getHours().toString().padStart(2, "0"));
                setMinute(now.getMinutes().toString().padStart(2, "0"));
                setSecond(now.getSeconds().toString().padStart(2, "0"));
                pushChange(
                  now,
                  now.getHours().toString().padStart(2, "0"),
                  now.getMinutes().toString().padStart(2, "0"),
                  now.getSeconds().toString().padStart(2, "0")
                );
              }}
            >
              重置为当前时间
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDate(undefined);
                setHour("");
                setMinute("");
                setSecond("");
                updateForm({ analysisTime: "" });
              }}
            >
              清空
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
