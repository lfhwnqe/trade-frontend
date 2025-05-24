"use client";

import * as React from "react";
import { format } from "date-fns";
import { ImageUploader } from "./ImageUploader";
import type { ImageResource } from "../request";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // 假设你的 cn 工具函数路径
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Trade, TradeFieldConfig, Option } from "@/app/trade/config"; // 假设类型从这里导入
import { DateRange } from "react-day-picker";

interface TradeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTrade: Trade | null;
  form: Partial<Trade>;
  tradeFields: TradeFieldConfig[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (key: keyof Trade, value: string) => void;
  handleDateRangeChange: (dateRange: DateRange | undefined) => void; // 确保与 page.tsx 中的类型一致
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function TradeFormDialog({
  open,
  onOpenChange,
  editTrade,
  form,
  tradeFields,
  handleChange,
  handleSelectChange,
  handleDateRangeChange,
  handleSubmit,
}: TradeFormDialogProps) {
  // 类型保护辅助，断言是否 ImageResource[]
  function isImageResourceArray(val: unknown): val is ImageResource[] {
    return Array.isArray(val) && val.every(img => typeof img === 'object' && img !== null && 'url' in img);
  }

  // 图片上传字段配置
  const handleImageChange =
    (key: "volumeProfileImage" | "hypothesisPaths" | "actualPath") =>
    (v: ImageResource[]) => {
      const nextForm = { ...form, [key]: v };
      // 推荐由上层 props 明确 setForm，不再用 any
      if (
        typeof window !== "undefined" &&
        "updateForm" in window &&
        typeof (window as { updateForm?: unknown }).updateForm === "function"
      ) {
        (window as { updateForm: (n: typeof nextForm) => void }).updateForm(nextForm);
      }
      // 如果 form 上存在 setForm，并且其为函数则调用
      if (
        Object.prototype.hasOwnProperty.call(form, "setForm") &&
        typeof (form as { setForm?: unknown }).setForm === "function"
      ) {
        (form as { setForm: (v: typeof nextForm) => void }).setForm(nextForm);
      }
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[825px] h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {editTrade?.transactionId ? "编辑交易记录" : "新增交易记录"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0" // min-h-0 允许子项溢出时滚动
        >
          <div className="flex-1 overflow-y-auto pr-2 py-3 space-y-4">
            {/* 三个图片字段独立插入上传组件 */}
            <ImageUploader
              label="成交量分布图"
              value={isImageResourceArray(form.volumeProfileImage) ? form.volumeProfileImage : []}
              onChange={handleImageChange("volumeProfileImage")}
              max={undefined}
            />
            <ImageUploader
              label="假设路径"
              value={isImageResourceArray(form.hypothesisPaths) ? form.hypothesisPaths : []}
              onChange={handleImageChange("hypothesisPaths")}
              max={3}
            />
            <ImageUploader
              label="实际路径"
              value={isImageResourceArray(form.actualPath) ? form.actualPath : []}
              onChange={handleImageChange("actualPath")}
              max={undefined}
            />
            <div className="grid gap-4">
              {tradeFields.map((field) => (
                <div
                  key={field.key}
                  className="grid grid-cols-4 items-center gap-4"
                >
                  <label htmlFor={field.key} className="text-right">
                    {field.label}
                    {field.required && "*"}:
                  </label>
                  {field.key === "dateTimeRange" ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "col-span-3 justify-start text-left font-normal",
                            !form.dateTimeRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.dateTimeRange ? (
                            format(new Date(form.dateTimeRange), "PPP")
                          ) : (
                            <span>选择日期</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            form.dateTimeRange
                              ? new Date(form.dateTimeRange)
                              : undefined
                          }
                          onSelect={(date) =>
                            handleDateRangeChange(
                              date ? { from: date, to: date } : undefined
                            )
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : field.options ? (
                    <Select
                      name={field.key}
                      value={(form[field.key as keyof Trade] as string) ?? ""}
                      onValueChange={(value) =>
                        handleSelectChange(field.key as keyof Trade, value)
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={`选择 ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option: Option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      name={field.key}
                      type={field.type || "text"}
                      value={(form[field.key as keyof Trade] as string) ?? ""}
                      onChange={handleChange}
                      className="col-span-3"
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="shrink-0 mt-2">
            <Button type="submit">
              {editTrade?.transactionId ? "保存更改" : "创建记录"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
