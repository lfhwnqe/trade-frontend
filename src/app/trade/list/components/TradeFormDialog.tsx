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
import { Textarea } from "@/components/ui/textarea";

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
  updateForm: (patch: Partial<Trade>) => void;
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
  updateForm,
}: TradeFormDialogProps) {
  // 类型保护辅助，断言是否 ImageResource[]
  function isImageResourceArray(val: unknown): val is ImageResource[] {
    return (
      Array.isArray(val) &&
      val.every(
        (img) => typeof img === "object" && img !== null && "url" in img
      )
    );
  }

  // 支持 textarea 的 change 事件
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  // 图片上传字段配置
  // 图片上传字段增量 patch，直接走 props.updateForm，避免覆盖其它内容
  const handleImageChange =
    (key: "volumeProfileImage" | "hypothesisPaths" | "actualPath") =>
    (v: ImageResource[]) => {
      if (
        typeof window !== "undefined" &&
        "updateForm" in window &&
        typeof (window as { updateForm?: unknown }).updateForm === "function"
      ) {
        // 若你在全局用 window.updateForm 调试，可保留
        (
          window as {
            updateForm: (
              k: Partial<
                Record<
                  "volumeProfileImage" | "hypothesisPaths" | "actualPath",
                  ImageResource[]
                >
              >
            ) => void;
          }
        ).updateForm({ [key]: v });
      }
      if (typeof updateForm === "function") {
        updateForm({ [key]: v });
      }
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] h-[92vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {editTrade?.transactionId ? "编辑交易记录" : "新增交易记录"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0" // min-h-0 允许子项溢出时滚动
        >
          <div className="flex-1 overflow-y-auto pr-2 py-3 space-y-6">
            {/* === 图片上传区 === */}
            <div className="bg-muted/70 rounded-lg p-4 pb-2 space-y-3 border">
              <div className="text-base font-semibold pb-1">图片信息</div>
              <ImageUploader
                label="成交量分布图"
                value={
                  isImageResourceArray(form.volumeProfileImage)
                    ? form.volumeProfileImage
                    : []
                }
                onChange={handleImageChange("volumeProfileImage")}
                max={undefined}
              />
              <ImageUploader
                label="假设路径"
                value={
                  isImageResourceArray(form.hypothesisPaths)
                    ? form.hypothesisPaths
                    : []
                }
                onChange={handleImageChange("hypothesisPaths")}
                max={3}
              />
              <ImageUploader
                label="实际路径"
                value={
                  isImageResourceArray(form.actualPath) ? form.actualPath : []
                }
                onChange={handleImageChange("actualPath")}
                max={undefined}
              />
            </div>

            {/* === 字段分组区 === */}
            {[
              {
                title: "基础信息",
                keys: [
                  "dateTimeRange",
                  "marketStructure",
                  "signalType",
                  "entryDirection",
                  "tradeDuration",
                ],
              },
              {
                title: "价格相关",
                keys: [
                  "entry",
                  "stopLoss",
                  "target",
                  "takeProfit",
                  "vah",
                  "val",
                  "poc",
                ],
              },
              {
                title: "结果复盘",
                keys: [
                  "profitLoss",
                  "riskRewardRatio",
                  "rr",
                  "analysisError",
                  "executionMindsetScore",
                  "improvement",
                ],
              },
              {
                title: "备注",
                keys: ["notes"],
              },
            ].map((group) => {
              const groupFields = tradeFields.filter((f) =>
                group.keys.includes(f.key)
              );
              if (groupFields.length === 0) return null;
              return (
                <div
                  key={group.title}
                  className="bg-muted/50 border rounded-lg p-4 pt-3"
                >
                  <div className="font-semibold text-base pb-2">
                    {group.title}
                  </div>
                  {/* 单textarea时特殊处理 */}
                  {group.keys.length === 1 && group.keys[0] === "notes" ? (
                    <div>
                      <label
                        htmlFor="notes"
                        className="block pb-1 text-muted-foreground"
                      >
                        备注
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={form.notes ?? ""}
                        onChange={handleTextAreaChange}
                        className="w-full border rounded-md bg-background px-3 py-2 min-h-[80px] resize-y outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="填写备注"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      {groupFields.map((field) => (
                        <div key={field.key} className="">
                          <label
                            htmlFor={field.key}
                            className="block pb-1 text-sm font-medium text-muted-foreground"
                          >
                            {field.label}
                            {field.required && (
                              <span className="ml-0.5 text-destructive">*</span>
                            )}
                            :
                          </label>
                          {field.key === "dateTimeRange" ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "justify-start text-left font-normal w-full",
                                    !form.dateTimeRange &&
                                      "text-muted-foreground"
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
                                      date
                                        ? { from: date, to: date }
                                        : undefined
                                    )
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          ) : field.options ? (
                            <Select
                              name={field.key}
                              value={
                                (form[field.key as keyof Trade] as string) ?? ""
                              }
                              onValueChange={(value) =>
                                handleSelectChange(
                                  field.key as keyof Trade,
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={`选择 ${field.label}`}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((option: Option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.key === "improvement" ||
                            field.key === "analysisError" ? (
                            // <textarea
                            //   id={field.key}
                            //   name={field.key}
                            //   value={(form[field.key as keyof Trade] as string) ?? ""}
                            //   onChange={handleTextAreaChange}
                            //   className="w-full border rounded-md bg-background px-3 py-2 min-h-[60px] resize-y outline-none focus:ring-2 focus:ring-primary/30"
                            //   placeholder={`填写${field.label}`}
                            //   required={field.required}
                            // />
                            <Textarea
                              placeholder="Type your message here."
                              value={
                                (form[field.key as keyof Trade] as string) ?? ""
                              }
                              onChange={handleTextAreaChange}
                            />
                          ) : (
                            <Input
                              id={field.key}
                              name={field.key}
                              type={field.type || "text"}
                              value={
                                (form[field.key as keyof Trade] as string) ?? ""
                              }
                              onChange={handleChange}
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* ====== DEBUG：图片组件上传数据实时展示 ====== */}
          {/* <div className="mt-6 p-3 border bg-muted/80 rounded-lg text-xs font-mono break-all select-all">
            <div className="font-bold pb-2">【调试用】图片组件上传/回填数据：</div>
            <div className="pb-1 text-blue-900 break-words">
              <div>volumeProfileImage:</div>
              <pre>{JSON.stringify(form.volumeProfileImage, null, 2)}</pre>
            </div>
            <div className="pb-1 text-green-900 break-words">
              <div>hypothesisPaths:</div>
              <pre>{JSON.stringify(form.hypothesisPaths, null, 2)}</pre>
            </div>
            <div className="pb-1 text-indigo-900 break-words">
              <div>actualPath:</div>
              <pre>{JSON.stringify(form.actualPath, null, 2)}</pre>
            </div>
          </div> */}
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
