"use client";

import * as React from "react";
import { format } from "date-fns";
import { DateTimePicker } from "./DateTimePicker";
import { ImageUploader } from "./ImageUploader";
import type { ImageResource } from "../../config";
import {
  entryDirectionOptions,
  marketStructureOptions,
  tradeStatusOptions,
} from "../../config";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Trade, TradeStatus } from "@/app/trade/config";
import { DateRange } from "react-day-picker";
import { Textarea } from "@/components/ui/textarea";

// 交易结果选项
const tradeResultOptions = [
  { label: "盈利", value: "PROFIT" },
  { label: "亏损", value: "LOSS" },
  { label: "保本", value: "BREAKEVEN" },
];

const followedPlanOptions = [
  { label: "是", value: "true" },
  { label: "否", value: "false" },
];
const planOptions = [
  { label: "A计划", value: "A" },
  { label: "B计划", value: "B" },
  { label: "C计划", value: "C" },
];

interface TradeFormProps {
  editTrade: Trade | null;
  form: Partial<Trade>;
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
          onChange={(e) => onChange({ ...value, entryReason: e.target.value })}
          placeholder="请输入入场理由"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm">入场信号</label>
        <Input
          value={value?.entrySignal ?? ""}
          onChange={(e) => onChange({ ...value, entrySignal: e.target.value })}
          placeholder="请输入入场信号"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm">退出信号</label>
        <Input
          value={value?.exitSignal ?? ""}
          onChange={(e) => onChange({ ...value, exitSignal: e.target.value })}
          placeholder="请输入退出信号"
        />
      </div>
    </div>
  );
}

export function TradeForm({
  editTrade,
  form,
  handleChange,
  handleSelectChange,
  handleDateRangeChange,
  handleImageChange,
  handlePlanChange,
  handleSubmit,
  updateForm,
}: TradeFormProps) {
  return (
    <div className="w-full mx-auto  bg-muted/50  ">
      <form onSubmit={handleSubmit} className="flex flex-col min-h-0 gap-y-6">
        {/* 1. 入场前分析 */}
        <div className="bg-muted/50 border rounded-lg p-4 pt-3">
          <div className="font-semibold text-base pb-2">入场前分析</div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-x-6 gap-y-4 mb-2">
            {/* 行情分析时间 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                行情分析时间
                <span className="ml-0.5 text-destructive">*</span>:
              </label>
              <DateTimePicker
                analysisTime={form.analysisTime}
                updateForm={(patch) =>
                  updateForm({ analysisTime: patch.analysisTime })
                }
              />
            </div>
            {/* 交易状态 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                交易状态<span className="ml-0.5 text-destructive">*</span>:
              </label>
              <Select
                name="status"
                value={(form.status as string) ?? ""}
                onValueChange={(value) =>
                  handleSelectChange("status" as keyof Trade, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择 交易状态" />
                </SelectTrigger>
                <SelectContent>
                  {tradeStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 市场结构 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                市场结构<span className="ml-0.5 text-destructive">*</span>:
              </label>
              <Select
                name="marketStructure"
                value={(form.marketStructure as string) ?? ""}
                onValueChange={(value) =>
                  handleSelectChange("marketStructure" as keyof Trade, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择 市场结构" />
                </SelectTrigger>
                <SelectContent>
                  {marketStructureOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 入场方向 - 只在已入场/已离场时必填 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                入场方向
                {(form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Select
                name="entryDirection"
                value={(form.entryDirection as string) ?? ""}
                onValueChange={(value) =>
                  handleSelectChange("entryDirection" as keyof Trade, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择 入场方向" />
                </SelectTrigger>
                <SelectContent>
                  {entryDirectionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* POC价格 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                POC价格:
              </label>
              <Input
                id="poc"
                name="poc"
                type="number"
                value={(form.poc as string) ?? ""}
                onChange={handleChange}
              />
            </div>

            {/* 价值区下沿 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                价值区下沿:
              </label>
              <Input
                id="val"
                name="val"
                type="number"
                value={(form.val as string) ?? ""}
                onChange={handleChange}
              />
            </div>

            {/* 价值区上沿 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                价值区上沿:
              </label>
              <Input
                id="vah"
                name="vah"
                type="number"
                value={(form.vah as string) ?? ""}
                onChange={handleChange}
              />
            </div>
            {/* 结构分析 */}
            <div className="col-span-2">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                结构分析:
              </label>
              <Textarea
                id="marketStructureAnalysis"
                name="marketStructureAnalysis"
                value={(form.marketStructureAnalysis as string) ?? ""}
                onChange={(e) =>
                  handleSelectChange("marketStructureAnalysis", e.target.value)
                }
              />
            </div>
            {/* 关键价位说明 */}
            <div className="col-span-2">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                关键价位说明:
              </label>
              <Textarea
                id="keyPriceLevels"
                name="keyPriceLevels"
                value={(form.keyPriceLevels as string) ?? ""}
                onChange={(e) =>
                  handleSelectChange("keyPriceLevels", e.target.value)
                }
              />
            </div>
            {/* 成交量分布图 */}
            <div className="col-span-full">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                成交量分布图：
              </label>
              <ImageUploader
                value={
                  Array.isArray(form.volumeProfileImages) &&
                  (form.volumeProfileImages as unknown[]).every(
                    (v) => typeof v === "object" && v !== null && "url" in v
                  )
                    ? (form.volumeProfileImages as unknown as ImageResource[])
                    : []
                }
                onChange={(imgs) =>
                  handleImageChange("volumeProfileImages", imgs)
                }
                max={5}
              />
            </div>
            {/* 假设路径图 */}
            <div className="col-span-full">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                假设路径图：
              </label>
              <ImageUploader
                value={
                  Array.isArray(form.expectedPathImages) &&
                  (form.expectedPathImages as unknown[]).every(
                    (v) => typeof v === "object" && v !== null && "url" in v
                  )
                    ? (form.expectedPathImages as unknown as ImageResource[])
                    : []
                }
                onChange={(imgs) =>
                  handleImageChange("expectedPathImages", imgs)
                }
                max={5}
              />
            </div>
          </div>
        </div>

        {/* 2. 入场计划 */}
        <div className="bg-muted/50 border rounded-lg p-4 pt-3">
          <div className="font-semibold text-base pb-2">入场计划</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            {/* 入场计划A */}
            <div>
              <div className="font-medium mb-2">A 计划</div>
              <EntryPlanForm
                value={form.entryPlanA as EntryPlan}
                onChange={(v) => handlePlanChange("entryPlanA", v)}
              />
            </div>
            {/* 入场计划B */}
            <div>
              <div className="font-medium mb-2">B 计划</div>
              <EntryPlanForm
                value={form.entryPlanB as EntryPlan}
                onChange={(v) => handlePlanChange("entryPlanB", v)}
              />
            </div>
            {/* 入场计划C */}
            <div>
              <div className="font-medium mb-2">C 计划</div>
              <EntryPlanForm
                value={form.entryPlanC as EntryPlan}
                onChange={(v) => handlePlanChange("entryPlanC", v)}
              />
            </div>
          </div>
        </div>

        {/* 3. 入场记录 */}
        <div className="bg-muted/50 border rounded-lg p-4 pt-3">
          <div className="font-semibold text-base pb-2">入场记录</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-6 gap-y-4">
            {/* 入场价格 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                入场价格
                {(form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Input
                id="entry"
                name="entry"
                type="number"
                value={(form.entry as string) ?? ""}
                onChange={handleChange}
                required={
                  form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED
                }
              />
            </div>
            {/* 入场时间 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                入场时间
                {(form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !form.entryTime && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.entryTime ? (
                      format(new Date(form.entryTime as string), "PPP")
                    ) : (
                      <span>选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      form.entryTime
                        ? new Date(form.entryTime as string)
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
            </div>
            {/* 止损点 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                止损点
                {(form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Input
                id="stopLoss"
                name="stopLoss"
                type="number"
                value={(form.stopLoss as string) ?? ""}
                onChange={handleChange}
                required={
                  form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED
                }
              />
            </div>
            {/* 止盈点 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                止盈点
                {(form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Input
                id="takeProfit"
                name="takeProfit"
                type="number"
                value={(form.takeProfit as string) ?? ""}
                onChange={handleChange}
                required={
                  form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED
                }
              />
            </div>
            {/* 入场理由 */}
            <div className="sm:col-span-2">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                入场理由
                {(form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Textarea
                id="entryReason"
                name="entryReason"
                value={(form.entryReason as string) ?? ""}
                onChange={(e) =>
                  handleSelectChange("entryReason", e.target.value)
                }
                required={
                  form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED
                }
              />
            </div>
            {/* 离场理由 */}
            <div className="sm:col-span-2">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                离场理由
                {(form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Textarea
                id="exitReason"
                name="exitReason"
                value={(form.exitReason as string) ?? ""}
                onChange={(e) =>
                  handleSelectChange("exitReason", e.target.value)
                }
                required={
                  form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED
                }
              />
            </div>
            {/* 心态记录 */}
            <div className="sm:col-span-2">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                心态记录
                {(form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Textarea
                id="mentalityNotes"
                name="mentalityNotes"
                value={(form.mentalityNotes as string) ?? ""}
                onChange={(e) =>
                  handleSelectChange("mentalityNotes", e.target.value)
                }
                required={
                  form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED
                }
              />
            </div>
          </div>
        </div>

        {/* 4. 离场后分析 */}
        <div className="bg-muted/50 border rounded-lg p-4 pt-3 space-y-2">
          <div className="font-semibold text-base pb-2">离场后分析</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            {/* 离场价格 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                离场价格
                {form.status === TradeStatus.EXITED && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Input
                id="exitPrice"
                name="exitPrice"
                type="number"
                value={(form.exitPrice as string) ?? ""}
                onChange={handleChange}
                required={form.status === TradeStatus.EXITED}
              />
            </div>
            {/* 离场时间 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                离场时间
                {form.status === TradeStatus.EXITED && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !form.exitTime && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.exitTime ? (
                      format(new Date(form.exitTime as string), "PPP")
                    ) : (
                      <span>选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      form.exitTime
                        ? new Date(form.exitTime as string)
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
            </div>
            {/* 交易结果 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                交易结果
                {form.status === TradeStatus.EXITED && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Select
                name="tradeResult"
                value={(form.tradeResult as string) ?? ""}
                onValueChange={(value) =>
                  handleSelectChange("tradeResult" as keyof Trade, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择 交易结果" />
                </SelectTrigger>
                <SelectContent>
                  {tradeResultOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* 是否执行了计划 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                是否执行了计划
                {form.status === TradeStatus.EXITED && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Select
                name="followedPlan"
                value={(form.followedPlan ?? false).toString()}
                onValueChange={(value) =>
                  handleSelectChange("followedPlan" as keyof Trade, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择 是否执行了计划" />
                </SelectTrigger>
                <SelectContent>
                  {followedPlanOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* 计划ID */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                计划类型
                {form.status === TradeStatus.EXITED && !!form.followedPlan && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              <Select
                name="followedPlanId"
                value={(form.followedPlanId as string) ?? ""}
                onValueChange={(value) =>
                  handleSelectChange("followedPlanId" as keyof Trade, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择 计划" />
                </SelectTrigger>
                <SelectContent>
                  {planOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* 盈亏% */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                盈亏%:
              </label>
              <Input
                id="profitLossPercentage"
                name="profitLossPercentage"
                type="number"
                value={(form.profitLossPercentage as string) ?? ""}
                onChange={handleChange}
              />
            </div>
            {/* 风险回报比 */}
            <div>
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                风险回报比:
              </label>
              <Input
                id="riskRewardRatio"
                name="riskRewardRatio"
                type="text"
                value={(form.riskRewardRatio as string) ?? ""}
                onChange={handleChange}
              />
            </div>
            {/* 实际路径图 */}
            <div className="col-span-full">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                实际路径图：
              </label>
              <ImageUploader
                value={
                  Array.isArray(form.actualPathImages) &&
                  (form.actualPathImages as unknown[]).every(
                    (v) => typeof v === "object" && v !== null && "url" in v
                  )
                    ? (form.actualPathImages as unknown as ImageResource[])
                    : []
                }
                onChange={(imgs) => handleImageChange("actualPathImages", imgs)}
                max={5}
              />
            </div>
            {/* 实际路径复盘 */}
            <div className="col-span-full">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                实际路径复盘:
              </label>
              <Textarea
                id="actualPathAnalysis"
                name="actualPathAnalysis"
                value={(form.actualPathAnalysis as string) ?? ""}
                onChange={(e) =>
                  handleSelectChange("actualPathAnalysis", e.target.value)
                }
              />
            </div>
            {/* 备注 */}
            <div className="col-span-full">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                备注:
              </label>
              <Textarea
                id="remarks"
                name="remarks"
                value={(form.remarks as string) ?? ""}
                onChange={(e) => handleSelectChange("remarks", e.target.value)}
              />
            </div>
            {/* 经验总结 */}
            <div className="col-span-full">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                经验总结:
              </label>
              <Textarea
                id="lessonsLearned"
                name="lessonsLearned"
                value={(form.lessonsLearned as string) ?? ""}
                onChange={(e) =>
                  handleSelectChange("lessonsLearned", e.target.value)
                }
              />
            </div>
          </div>
        </div>
        {/* 提交按钮 */}
        <div className="shrink-0 mt-2 flex justify-end">
          <Button type="submit">
            {editTrade?.transactionId ? "保存更改" : "创建记录"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// 兼容性导出，方便老代码引用
export { TradeForm as TradeFormDialog };
export default TradeForm;
