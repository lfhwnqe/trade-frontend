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
  handleDateRangeChange: (dateRange: DateRange | undefined) => void;
  handleImageChange: (key: string, value: ImageResource[]) => void;
  handlePlanChange: (key: string, value: EntryPlan) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  updateForm: (patch: Partial<Trade>) => void;
}

interface EntryPlan {
  entryReason?: string;
  entrySignal?: string;
  exitSignal?: string;
}

function EntryPlanForm({
  value,
  onChange,
}: {
  value?: EntryPlan;
  onChange: (v: EntryPlan) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-sm">入场理由</label>
        <Input
          value={value?.entryReason ?? ""}
          onChange={e => onChange({ ...value, entryReason: e.target.value })}
          placeholder="请输入入场理由"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm">入场信号</label>
        <Input
          value={value?.entrySignal ?? ""}
          onChange={e => onChange({ ...value, entrySignal: e.target.value })}
          placeholder="请输入入场信号"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm">退出信号</label>
        <Input
          value={value?.exitSignal ?? ""}
          onChange={e => onChange({ ...value, exitSignal: e.target.value })}
          placeholder="请输入退出信号"
        />
      </div>
    </div>
  );
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
  handleImageChange,
  handlePlanChange,
  handleSubmit,
  updateForm,
}: TradeFormDialogProps) {
  // 类型保护辅助，断言是否 ImageResource[]
  // 已经弃用的辅助函数与事件，可删除

  // 支持 textarea 的 change 事件
  // 已经弃用的辅助函数与事件，可删除

  // 已弃用

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
            {/* 1. 入场前分析 */}
            <div className="bg-muted/50 border rounded-lg p-4 pt-3">
              <div className="font-semibold text-base pb-2">入场前分析</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-2">
                {tradeFields
                  .filter(f =>
                    [
                      "dateTimeRange",
                      "status",
                      "marketStructure",
                      "marketStructureAnalysis",
                      "signalType",
                      "volumeProfileImages",
                      "poc",
                      "val",
                      "vah",
                      "keyPriceLevels",
                      "expectedPathImages",
                      "expectedPathAnalysis",
                    ].includes(f.key),
                  )
                  .map(field => {
                    const status = form.status as string | undefined;
                    const isRequired =
                      typeof field.required === "function"
                        ? field.required(status, form)
                        : !!field.required;

                    // 图片类型
                    if (field.type === "image-array") {
                      return (
                        <div key={field.key} className="col-span-2">
                          <label className="block pb-1 text-sm font-medium text-muted-foreground">
                            {field.label}：
                          </label>
                          <ImageUploader
                            label={field.label}
                            value={
                              Array.isArray(form[field.key as keyof Trade]) &&
                              (form[field.key as keyof Trade] as unknown[]).every(
                                v => typeof v === "object" && v !== null && "url" in v
                              )
                                ? (form[field.key as keyof Trade] as unknown as ImageResource[])
                                : []
                            }
                            onChange={imgs => handleImageChange(field.key, imgs)}
                            max={5}
                          />
                        </div>
                      );
                    }
                    // 普通输入
                    return (
                      <div key={field.key}>
                        <label className="block pb-1 text-sm font-medium text-muted-foreground">
                          {field.label}
                          {isRequired && <span className="ml-0.5 text-destructive">*</span>}:
                        </label>
                        {field.type === "date" ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "justify-start text-left font-normal w-full",
                                  !form[field.key as keyof Trade] && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form[field.key as keyof Trade]
                                  ? format(new Date(form[field.key as keyof Trade] as string), "PPP")
                                  : <span>选择日期</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={
                                  form[field.key as keyof Trade]
                                    ? new Date(form[field.key as keyof Trade] as string)
                                    : undefined
                                }
                                onSelect={date =>
                                  handleDateRangeChange(
                                    date ? { from: date, to: date } : undefined,
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
                            onValueChange={value =>
                              handleSelectChange(field.key as keyof Trade, value)
                            }
                          >
                            <SelectTrigger className="w-full">
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
                            required={isRequired}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 2. 入场计划 */}
            <div className="bg-muted/50 border rounded-lg p-4 pt-3">
              <div className="font-semibold text-base pb-2">入场计划</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                {["entryPlanA", "entryPlanB", "entryPlanC"].map((k, idx) => (
                  <div key={k}>
                    <div className="font-medium mb-2">{["A", "B", "C"][idx]} 计划</div>
                    <EntryPlanForm
                      value={form[k as keyof Trade] as EntryPlan}
                      onChange={v => handlePlanChange(k, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 入场记录 */}
            <div className="bg-muted/50 border rounded-lg p-4 pt-3">
              <div className="font-semibold text-base pb-2">入场记录</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                {tradeFields
                  .filter(f =>
                    [
                      "entry",
                      "entryTime",
                      "entryDirection",
                      "stopLoss",
                      "takeProfit",
                      "mentalityNotes",
                      "entryReason",
                      "exitReason",
                    ].includes(f.key),
                  )
                  .map(field => {
                    const status = form.status as string | undefined;
                    const isRequired =
                      typeof field.required === "function"
                        ? field.required(status, form)
                        : !!field.required;
                    return (
                      <div key={field.key}>
                        <label className="block pb-1 text-sm font-medium text-muted-foreground">
                          {field.label}{isRequired && <span className="ml-0.5 text-destructive">*</span>}:
                        </label>
                        {field.options ? (
                          <Select
                            name={field.key}
                            value={(form[field.key as keyof Trade] as string) ?? ""}
                            onValueChange={value =>
                              handleSelectChange(field.key as keyof Trade, value)
                            }
                          >
                            <SelectTrigger className="w-full">
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
                            required={isRequired}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 4. 离场后分析 */}
            <div className="bg-muted/50 border rounded-lg p-4 pt-3 space-y-2">
              <div className="font-semibold text-base pb-2">离场后分析</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {tradeFields
                  .filter(f =>
                    [
                      "exitPrice",
                      "exitTime",
                      "tradeResult",
                      "followedPlan",
                      "followedPlanId",
                      "actualPathImages",
                      "actualPathAnalysis",
                      "remarks",
                      "lessonsLearned",
                      "analysisImages",
                      "profitLossPercentage",
                      "riskRewardRatio",
                    ].includes(f.key),
                  )
                  .map(field => {
                    const status = form.status as string | undefined;
                    const isRequired =
                      typeof field.required === "function"
                        ? field.required(status, form)
                        : !!field.required;

                    if (field.type === "image-array") {
                      return (
                        <div key={field.key} className="col-span-2">
                          <label className="block pb-1 text-sm font-medium text-muted-foreground">
                            {field.label}：
                          </label>
                          <ImageUploader
                            label={field.label}
                            value={
                              Array.isArray(form[field.key as keyof Trade]) &&
                              (form[field.key as keyof Trade] as unknown[]).every(
                                v => typeof v === "object" && v !== null && "url" in v
                              )
                                ? (form[field.key as keyof Trade] as unknown as ImageResource[])
                                : []
                            }
                            onChange={imgs => handleImageChange(field.key, imgs)}
                            max={5}
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={field.key}>
                        <label className="block pb-1 text-sm font-medium text-muted-foreground">
                          {field.label}
                          {isRequired && <span className="ml-0.5 text-destructive">*</span>}:
                        </label>
                        {field.options ? (
                          <Select
                            name={field.key}
                            value={(form[field.key as keyof Trade] as string) ?? ""}
                            onValueChange={value =>
                              handleSelectChange(field.key as keyof Trade, value)
                            }
                          >
                            <SelectTrigger className="w-full">
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
                        ) : field.type === "checkbox" ? (
                          <input
                            id={field.key}
                            name={field.key}
                            type="checkbox"
                            checked={!!form[field.key as keyof Trade]}
                            onChange={e => updateForm({ [field.key]: e.target.checked })}
                            className="w-4 h-4 mt-1"
                          />
                        ) : (
                          <Input
                            id={field.key}
                            name={field.key}
                            type={field.type || "text"}
                            value={(form[field.key as keyof Trade] as string) ?? ""}
                            onChange={handleChange}
                            required={isRequired}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
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
