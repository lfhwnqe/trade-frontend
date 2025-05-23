"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TradeQuery, marketStructureOptions, signalTypeOptions, entryDirectionOptions, Option } from "../../config";

interface TradeQueryFormProps {
  queryForm: TradeQuery;
  onQueryFormChange: (value: TradeQuery) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export default function TradeQueryForm({
  queryForm,
  onQueryFormChange,
  onSubmit,
  onReset,
}: TradeQueryFormProps) {
  return (
    <form
      className="flex flex-wrap gap-2 mb-4 items-end"
      onSubmit={onSubmit}
    >
      <div>
        <label className="block text-xs mb-1">时间段</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !queryForm.dateTimeRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {queryForm.dateTimeRange?.from ? (
                queryForm.dateTimeRange.to ? (
                  <>
                    {format(queryForm.dateTimeRange.from, "yyyy-MM-dd")} -{" "}
                    {format(queryForm.dateTimeRange.to, "yyyy-MM-dd")}
                  </>
                ) : (
                  format(queryForm.dateTimeRange.from, "yyyy-MM-dd")
                )
              ) : (
                <span>选择日期范围</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={queryForm.dateTimeRange?.from}
              selected={queryForm.dateTimeRange}
              onSelect={(range) =>
                onQueryFormChange({ ...queryForm, dateTimeRange: range })
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="block text-xs mb-1">结构</label>
        <Select
          value={queryForm.marketStructure ?? ""}
          onValueChange={(value: string) =>
            onQueryFormChange({ ...queryForm, marketStructure: value })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {marketStructureOptions.map((opt: Option) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs mb-1">信号类型</label>
        <Select
          value={queryForm.signalType ?? ""}
          onValueChange={(value: string) =>
            onQueryFormChange({ ...queryForm, signalType: value })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {signalTypeOptions.map((opt: Option) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs mb-1">方向</label>
        <Select
          value={queryForm.entryDirection ?? ""}
          onValueChange={(value: string) =>
            onQueryFormChange({ ...queryForm, entryDirection: value })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {entryDirectionOptions.map((opt: Option) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="ml-2" variant="secondary">
        查询
      </Button>
      <Button
        type="button"
        variant="outline"
        className="ml-1"
        onClick={onReset}
      >
        重置
      </Button>
    </form>
  );
}
