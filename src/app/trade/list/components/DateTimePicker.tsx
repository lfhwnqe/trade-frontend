import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateTimePickerProps {
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

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  analysisTime,
  updateForm,
  showTimePicker = true,
  showSeconds = true,
  placeholder = "选择日期与时间",
  dateFormat = "yyyy-MM-dd",
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal w-full",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <span>{formatDisplayTime()}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex flex-col gap-2 p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onCalendarChange}
            initialFocus
          />
          {showTimePicker && (
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
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};