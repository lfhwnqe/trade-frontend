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
import {
  TradeQuery,
  marketStructureOptions,
  entryDirectionOptions,
  tradeStatusOptions,
  Option,
  tradeTypeOptions,
  tradeGradeOptions,
} from "../../config";

// 交易结果选项
const tradeResultOptions = [
  { label: "全部", value: "all" },
  { label: "盈利", value: "盈利" },
  { label: "亏损", value: "亏损" },
  { label: "保本", value: "保本" },
];

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
  // 内部重置函数，确保所有字段都被重置
  const handleReset = () => {
    // 重置所有查询条件
    onQueryFormChange({
      dateTimeRange: undefined,
      marketStructure: 'all',
      entryDirection: 'all',
      tradeStatus: 'all',
      tradeResult: 'all',
    });
    // 调用外部重置函数
    onReset();
  };
  return (
    <form className="flex flex-wrap gap-2 mb-4 items-end" onSubmit={onSubmit}>
      <div>
        <label className="block text-xs mb-1">创建时间</label>
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
              onSelect={(range) => {
                // 如果只选择了一个日期，将其同时设置为开始和结束日期
                if (range?.from && !range.to) {
                  const completeRange = {
                    from: range.from,
                    to: range.from
                  };
                  onQueryFormChange({ ...queryForm, dateTimeRange: completeRange });
                } else {
                  onQueryFormChange({ ...queryForm, dateTimeRange: range });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="block text-xs mb-1">交易类型</label>
        <Select
          value={queryForm.type ?? ""}
          onValueChange={(value: string) =>
            onQueryFormChange({ ...queryForm, type: value })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {tradeTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs mb-1">交易分级</label>
        <Select
          value={queryForm.grade ?? ""}
          onValueChange={(value: string) =>
            onQueryFormChange({ ...queryForm, grade: value })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {tradeGradeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      <div>
        <label className="block text-xs mb-1">状态</label>
        <Select
          value={queryForm.tradeStatus ?? ""}
          onValueChange={(value: string) =>
            onQueryFormChange({ ...queryForm, tradeStatus: value })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {tradeStatusOptions.map((opt: Option) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs mb-1">结果</label>
        <Select
          value={queryForm.tradeResult ?? ""}
          onValueChange={(value: string) =>
            onQueryFormChange({ ...queryForm, tradeResult: value })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            {tradeResultOptions.map((opt: Option) => (
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
        onClick={handleReset}
      >
        重置
      </Button>
    </form>
  );
}
