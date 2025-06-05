"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
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
  // 展开/收起状态
  const [isExpanded, setIsExpanded] = React.useState(false);

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
    <div className="bg-card border rounded-lg p-3 mb-3 shadow-sm">
      <form onSubmit={onSubmit} className="space-y-3">
        {/* 基础查询条件 - 始终显示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* 日期范围 */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              创建时间
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-9",
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

          {/* 交易状态 */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              交易状态
            </label>
            <Select
              value={queryForm.tradeStatus ?? ""}
              onValueChange={(value: string) =>
                onQueryFormChange({ ...queryForm, tradeStatus: value })
              }
            >
              <SelectTrigger className="w-full h-9">
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
        </div>

        {/* 高级查询条件 - 可展开/收起 */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border animate-in slide-in-from-top-1">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                交易类型
              </label>
              <Select
                value={queryForm.type ?? ""}
                onValueChange={(value: string) =>
                  onQueryFormChange({ ...queryForm, type: value })
                }
              >
                <SelectTrigger className="w-full h-9">
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
              <label className="block text-xs font-medium text-foreground mb-1">
                交易分级
              </label>
              <Select
                value={queryForm.grade ?? ""}
                onValueChange={(value: string) =>
                  onQueryFormChange({ ...queryForm, grade: value })
                }
              >
                <SelectTrigger className="w-full h-9">
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
              <label className="block text-xs font-medium text-foreground mb-1">
                市场结构
              </label>
              <Select
                value={queryForm.marketStructure ?? ""}
                onValueChange={(value: string) =>
                  onQueryFormChange({ ...queryForm, marketStructure: value })
                }
              >
                <SelectTrigger className="w-full h-9">
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
              <label className="block text-xs font-medium text-foreground mb-1">
                交易方向
              </label>
              <Select
                value={queryForm.entryDirection ?? ""}
                onValueChange={(value: string) =>
                  onQueryFormChange({ ...queryForm, entryDirection: value })
                }
              >
                <SelectTrigger className="w-full h-9">
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
              <label className="block text-xs font-medium text-foreground mb-1">
                交易结果
              </label>
              <Select
                value={queryForm.tradeResult ?? ""}
                onValueChange={(value: string) =>
                  onQueryFormChange({ ...queryForm, tradeResult: value })
                }
              >
                <SelectTrigger className="w-full h-9">
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
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border">
          {/* 左侧：展开/收起按钮 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200",
              "transform hover:scale-105"
            )}
          >
            <div className={cn(
              "transition-transform duration-300",
              isExpanded ? "rotate-180" : "rotate-0"
            )}>
              <ChevronDown className="h-4 w-4" />
            </div>
            {isExpanded ? "收起高级查询" : "展开高级查询"}
          </Button>

          {/* 右侧：查询和重置按钮 */}
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="w-16 h-8 font-medium text-sm hover:scale-105 transition-transform duration-200"
              size="sm"
            >
              查询
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-16 h-8 text-sm hover:scale-105 transition-transform duration-200"
              size="sm"
              onClick={handleReset}
            >
              重置
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
