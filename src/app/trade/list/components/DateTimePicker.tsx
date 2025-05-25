import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DateTimePickerProps {
  analysisTime?: string;
  updateForm: (patch: { analysisTime: string }) => void;
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
            <span>
              {format(date, "yyyy-MM-dd")}
              {" "}
              {`${hour || "00"}:${minute || "00"}:${second || "00"}`}
            </span>
          ) : (
            <span>选择日期与时间</span>
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
          <div className="flex items-center gap-1 mt-2">
            <Input
              type="number"
              className="w-12 h-8 px-2 py-1"
              min={0}
              max={23}
              value={hour}
              onChange={e => {
                const v = e.target.value.replace(/\D/, "");
                setHour(v);
                onTimeChange("hour", v);
              }}
              placeholder="时"
            />
            <span>:</span>
            <Input
              type="number"
              className="w-12 h-8 px-2 py-1"
              min={0}
              max={59}
              value={minute}
              onChange={e => {
                const v = e.target.value.replace(/\D/, "");
                setMinute(v);
                onTimeChange("minute", v);
              }}
              placeholder="分"
            />
            <span>:</span>
            <Input
              type="number"
              className="w-12 h-8 px-2 py-1"
              min={0}
              max={59}
              value={second}
              onChange={e => {
                const v = e.target.value.replace(/\D/, "");
                setSecond(v);
                onTimeChange("second", v);
              }}
              placeholder="秒"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};