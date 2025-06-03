"use client";

import * as React from "react";
import { DateCalendarPicker } from "../../../../components/common/DateCalendarPicker";
import { ImageUploader } from "../../../../components/common/ImageUploader";
import type { ImageResource, Trade } from "../../config";
import {
  TradeStatus,
  entryDirectionOptions,
  marketStructureOptions,
  planOptions,
  tradeGradeOptions,
  tradeResultOptions,
  tradeStatusOptions,
  tradeTypeOptions,
} from "../../config";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DateRange } from "react-day-picker";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/common/alert";

export interface TradeFormProps {
  editTrade: Trade | null;
  form: Partial<Trade>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (key: keyof Trade, value: string) => void;
  handleDateRangeChange: (dateRange: DateRange | undefined) => void;
  handleImageChange: (key: string, value: ImageResource[]) => void;
  handlePlanChange: (key: string, value: EntryPlan) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  updateForm: (patch: Partial<Trade>) => void;
  loading?: boolean;
}

export interface TradeFormRef {
  submit: () => void;
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

export const TradeForm = React.forwardRef<TradeFormRef, TradeFormProps>(
  (
    {
      form,
      handleChange,
      handleSelectChange,
      handleImageChange,
      handlePlanChange,
      handleSubmit,
      updateForm, // 默认为false
    },
    ref
  ) => {
    const [, errorAlert] = useAlert();
    // 错误信息状态
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    // 创建自定义的表单更新处理函数，在更新表单数据的同时清除相应字段的错误
    const handleFormChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // 清除当前字段的错误提示
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[e.target.name];
          return newErrors;
        });
        // 调用原始的handleChange函数
        handleChange(e);
      },
      [handleChange]
    );

    // 创建自定义的选择更新处理函数
    const handleFormSelectChange = React.useCallback(
      (key: keyof Trade, value: string) => {
        // 清除当前字段的错误提示
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key as string];
          return newErrors;
        });
        // 调用原始的handleSelectChange函数
        handleSelectChange(key, value);
      },
      [handleSelectChange]
    );

    // 创建自定义的表单更新函数
    const handleFormUpdate = React.useCallback(
      (patch: Partial<Trade>) => {
        // 清除更新字段的错误提示
        setErrors((prev) => {
          const newErrors = { ...prev };
          Object.keys(patch).forEach((key) => {
            delete newErrors[key];
          });
          return newErrors;
        });
        // 调用原始的updateForm函数
        updateForm(patch);
      },
      [updateForm]
    );

    // 验证表单
    const validateForm = () => {
      const newErrors: Record<string, string> = {};

      // 必填字段验证
      if (!form.analysisTime) {
        newErrors.analysisTime = "行情分析时间为必填项";
      }

      if (!form.tradeType) {
        newErrors.tradeType = "交易类型为必填项";
      }

      if (!form.status) {
        newErrors.status = "交易状态为必填项";
      }

      if (!form.marketStructure) {
        newErrors.marketStructure = "市场结构为必填项";
      }

      // 根据交易状态验证必填字段
      if (
        form.status === TradeStatus.ENTERED ||
        form.status === TradeStatus.EXITED
      ) {
        if (!form.entryDirection) {
          newErrors.entryDirection = "入场方向为必填项";
        }

        if (!form.entry) {
          newErrors.entry = "入场价格为必填项";
        }

        if (!form.entryTime) {
          newErrors.entryTime = "入场时间为必填项";
        }

        if (!form.stopLoss) {
          newErrors.stopLoss = "止损点为必填项";
        }

        if (!form.takeProfit) {
          newErrors.takeProfit = "止盈点为必填项";
        }
      }

      // 已离场状态的额外验证
      if (form.status === TradeStatus.EXITED) {
        if (!form.exitPrice) {
          newErrors.exitPrice = "离场价格为必填项";
        }

        if (!form.exitTime) {
          newErrors.exitTime = "离场时间为必填项";
        }

        if (!form.tradeResult) {
          newErrors.tradeResult = "交易结果为必填项";
        }

        // 如果选择了执行计划，则计划类型必填
        if (form.followedPlan && !form.followedPlanId) {
          newErrors.followedPlanId = "计划类型为必填项";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // 包装提交处理函数
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // 验证表单
      if (validateForm()) {
        // 验证通过，调用原始的提交函数
        handleSubmit(e);
      } else {
        // 滚动到第一个错误字段
        const firstErrorField = document.getElementById(Object.keys(errors)[0]);
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }

        // 显示错误提示
        const errorCount = Object.keys(errors).length;
        errorAlert(
          `表单有 ${errorCount} 个必填项未填写，请检查标记为红色的字段。`
        );
      }
    };

    // 暴露组件方法
    React.useImperativeHandle(ref, () => ({
      submit: () => {
        // 验证表单
        if (validateForm()) {
          // 验证通过，创建一个合成的表单提交事件
          const event = new Event("submit", {
            cancelable: true,
          }) as unknown as React.FormEvent<HTMLFormElement>;
          handleSubmit(event);
        } else {
          // 滚动到第一个错误字段
          const firstErrorField = document.getElementById(
            Object.keys(errors)[0]
          );
          if (firstErrorField) {
            firstErrorField.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }

          // 显示错误提示
          const errorCount = Object.keys(errors).length;
          errorAlert(
            `表单有 ${errorCount} 个必填项未填写，请检查标记为红色的字段。`
          );
        }
      },
    }));

    return (
      <div className="flex-1 flex flex-col">
        {/* <div className="w-full flex-1 flex flex-col mx-auto  bg-muted/50"> */}
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1">
          <div className="flex flex-col flex-1 gap-y-6 ">
            {/* 1. 入场前分析 */}
            <div className="bg-muted/50 border rounded-lg p-4 pt-3">
              <div className="font-semibold text-base pb-2">入场前分析</div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-6 gap-y-4 mb-2">
                {/* 行情分析时间 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    行情分析时间
                    <span className="ml-0.5 text-destructive">*</span>:
                  </label>
                  <DateCalendarPicker
                    analysisTime={form.analysisTime}
                    updateForm={(patch) =>
                      handleFormUpdate({ analysisTime: patch.analysisTime })
                    }
                  />
                  {errors.analysisTime && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.analysisTime}
                    </p>
                  )}
                </div>
                {/* 交易类型 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    交易类型<span className="ml-0.5 text-destructive">*</span>:
                  </label>
                  <Select
                    name="tradeType"
                    value={form.tradeType ?? ""}
                    onValueChange={(value) =>
                      handleFormSelectChange("tradeType", value)
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.tradeType ? "border-destructive" : ""
                      }`}
                    >
                      <SelectValue placeholder="请选择交易类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {tradeTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tradeType && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.tradeType}
                    </p>
                  )}
                </div>
                {/* 交易分级 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    交易分级
                  </label>
                  <Select
                    name="grade"
                    value={(form.grade as string) ?? ""}
                    onValueChange={(value) =>
                      handleFormSelectChange("grade", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      {tradeGradeOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* 分析是否过期 */}
                <div className="col-span-2 flex items-center">
                  <input
                    id="analysisExpired"
                    type="checkbox"
                    className="mr-2"
                    checked={!!form.analysisExpired}
                    onChange={(e) =>
                      handleFormUpdate({ analysisExpired: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="analysisExpired"
                    className="text-sm font-medium text-muted-foreground select-none"
                  >
                    分析已过期
                  </label>
                </div>
                {/* 交易状态 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    交易状态<span className="ml-0.5 text-destructive">*</span>:
                  </label>
                  <Select
                    name="status"
                    value={(form.status as string) ?? ""}
                    onValueChange={(value) =>
                      handleFormSelectChange("status" as keyof Trade, value)
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.status ? "border-destructive" : ""
                      }`}
                    >
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
                  {errors.status && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.status}
                    </p>
                  )}
                </div>

                {/* 市场结构 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    市场结构<span className="ml-0.5 text-destructive">*</span>:
                  </label>
                  <Select
                    name="marketStructure"
                    value={(form.marketStructure as string) ?? ""}
                    onValueChange={(value) =>
                      handleFormSelectChange(
                        "marketStructure" as keyof Trade,
                        value
                      )
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.marketStructure ? "border-destructive" : ""
                      }`}
                    >
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
                  {errors.marketStructure && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.marketStructure}
                    </p>
                  )}
                </div>

                {/* POC价格 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    POC价格:
                  </label>
                  <Input
                    id="poc"
                    name="poc"
                    type="number"
                    value={(form.poc as string) ?? ""}
                    onChange={handleFormChange}
                  />
                </div>

                {/* 价值区下沿 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    价值区下沿:
                  </label>
                  <Input
                    id="val"
                    name="val"
                    type="number"
                    value={(form.val as string) ?? ""}
                    onChange={handleFormChange}
                  />
                </div>

                {/* 价值区上沿 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    价值区上沿:
                  </label>
                  <Input
                    id="vah"
                    name="vah"
                    type="number"
                    value={(form.vah as string) ?? ""}
                    onChange={handleFormChange}
                  />
                </div>
                {/* 结构分析 */}
                <div className="col-span-3">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    结构分析:
                  </label>
                  <Textarea
                    id="marketStructureAnalysis"
                    name="marketStructureAnalysis"
                    value={(form.marketStructureAnalysis as string) ?? ""}
                    onChange={(e) =>
                      handleSelectChange(
                        "marketStructureAnalysis",
                        e.target.value
                      )
                    }
                  />
                </div>
                {/* 关键价位说明 */}
                <div className="col-span-3">
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
                <div className="col-span-3">
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
                <div className="col-span-2">
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

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-6 gap-y-4">
                {/* 入场方向 - 只在已入场/已离场时必填 */}
                <div className="col-span-2">
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
                      handleFormSelectChange(
                        "entryDirection" as keyof Trade,
                        value
                      )
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.entryDirection ? "border-destructive" : ""
                      }`}
                    >
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
                  {errors.entryDirection && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.entryDirection}
                    </p>
                  )}
                </div>
                {/* 入场价格 */}
                <div className="col-span-2">
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
                    onChange={handleFormChange}
                    className={errors.entry ? "border-destructive" : ""}
                  />
                  {errors.entry && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.entry}
                    </p>
                  )}
                </div>
                {/* 入场时间 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    入场时间
                    {(form.status === TradeStatus.ENTERED ||
                      form.status === TradeStatus.EXITED) && (
                      <span className="ml-0.5 text-destructive">*</span>
                    )}
                    :
                  </label>
                  <DateCalendarPicker
                    analysisTime={form.entryTime}
                    updateForm={(patch) =>
                      handleFormUpdate({ entryTime: patch.analysisTime })
                    }
                  />
                  {errors.entryTime && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.entryTime}
                    </p>
                  )}
                </div>
                {/* 止损点 */}
                <div className="col-span-2">
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
                    onChange={handleFormChange}
                    className={errors.stopLoss ? "border-destructive" : ""}
                  />
                  {errors.stopLoss && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.stopLoss}
                    </p>
                  )}
                </div>
                {/* 止盈点 */}
                <div className="col-span-2">
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
                    onChange={handleFormChange}
                    className={errors.takeProfit ? "border-destructive" : ""}
                  />
                  {errors.takeProfit && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.takeProfit}
                    </p>
                  )}
                </div>
                {/* 入场理由 */}
                <div className="col-span-3">
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
                    onChange={(e) => {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors["entryReason"];
                        return newErrors;
                      });
                      handleSelectChange("entryReason", e.target.value);
                    }}
                    className={errors.entryReason ? "border-destructive" : ""}
                  />
                  {errors.entryReason && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.entryReason}
                    </p>
                  )}
                </div>
                {/* 离场理由 */}
                <div className="col-span-3">
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
                    onChange={(e) => {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors["exitReason"];
                        return newErrors;
                      });
                      handleSelectChange("exitReason", e.target.value);
                    }}
                    className={errors.exitReason ? "border-destructive" : ""}
                  />
                  {errors.exitReason && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.exitReason}
                    </p>
                  )}
                </div>
                {/* 心态记录 */}
                <div className="col-span-3">
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
                    onChange={(e) => {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors["mentalityNotes"];
                        return newErrors;
                      });
                      handleSelectChange("mentalityNotes", e.target.value);
                    }}
                    className={
                      errors.mentalityNotes ? "border-destructive" : ""
                    }
                  />
                  {errors.mentalityNotes && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.mentalityNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 4. 离场后分析 */}
            <div className="bg-muted/50 border rounded-lg p-4 pt-3 space-y-2">
              <div className="font-semibold text-base pb-2">离场后分析</div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-6 gap-y-4">
                {/* 离场价格 */}
                <div className="col-span-2">
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
                    onChange={handleFormChange}
                    className={errors.exitPrice ? "border-destructive" : ""}
                  />
                  {errors.exitPrice && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.exitPrice}
                    </p>
                  )}
                </div>
                {/* 离场时间 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    离场时间
                    {form.status === TradeStatus.EXITED && (
                      <span className="ml-0.5 text-destructive">*</span>
                    )}
                    :
                  </label>
                  <DateCalendarPicker
                    analysisTime={form.exitTime}
                    updateForm={(patch) =>
                      handleFormUpdate({ exitTime: patch.analysisTime })
                    }
                  />
                  {errors.exitTime && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.exitTime}
                    </p>
                  )}
                </div>
                {/* 交易结果 */}
                <div className="col-span-2">
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
                      handleFormSelectChange(
                        "tradeResult" as keyof Trade,
                        value
                      )
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.tradeResult ? "border-destructive" : ""
                      }`}
                    >
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
                  {errors.tradeResult && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.tradeResult}
                    </p>
                  )}
                </div>
                {/* 是否执行了计划 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    是否执行了计划
                    {form.status === TradeStatus.EXITED && (
                      <span className="ml-0.5 text-destructive">*</span>
                    )}
                    :
                  </label>
                  <Select
                    name="followedPlan"
                    value={
                      form.followedPlan === true
                        ? "true"
                        : form.followedPlan === false
                        ? "false"
                        : ""
                    }
                    onValueChange={(value) => {
                      const boolValue = value === "true";
                      handleFormUpdate({ followedPlan: boolValue });

                      // 如果选择了"否"，清除followedPlanId字段的错误
                      if (!boolValue) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors["followedPlanId"];
                          return newErrors;
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择 是否执行计划" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">是</SelectItem>
                      <SelectItem value="false">否</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* 计划ID */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    计划类型
                    {form.status === TradeStatus.EXITED &&
                      !!form.followedPlan && (
                        <span className="ml-0.5 text-destructive">*</span>
                      )}
                    :
                  </label>
                  <Select
                    name="followedPlanId"
                    value={(form.followedPlanId as string) ?? ""}
                    onValueChange={(value) =>
                      handleFormSelectChange(
                        "followedPlanId" as keyof Trade,
                        value
                      )
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.followedPlanId ? "border-destructive" : ""
                      }`}
                    >
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
                  {errors.followedPlanId && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.followedPlanId}
                    </p>
                  )}
                </div>
                {/* 盈亏% */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    盈亏%:
                  </label>
                  <Input
                    id="profitLossPercentage"
                    name="profitLossPercentage"
                    type="number"
                    value={(form.profitLossPercentage as string) ?? ""}
                    onChange={handleFormChange}
                  />
                </div>
                {/* 风险回报比 */}
                <div className="col-span-2">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    风险回报比:
                  </label>
                  <Input
                    id="riskRewardRatio"
                    name="riskRewardRatio"
                    type="text"
                    value={(form.riskRewardRatio as string) ?? ""}
                    onChange={handleFormChange}
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
                    onChange={(imgs) =>
                      handleImageChange("actualPathImages", imgs)
                    }
                    max={5}
                  />
                </div>
                {/* 实际路径复盘 */}
                <div className="col-span-3">
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
                <div className="col-span-3">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    备注:
                  </label>
                  <Textarea
                    id="remarks"
                    name="remarks"
                    value={(form.remarks as string) ?? ""}
                    onChange={(e) =>
                      handleSelectChange("remarks", e.target.value)
                    }
                  />
                </div>
                {/* 经验总结 */}
                <div className="col-span-3">
                  <label className="block pb-1 text-sm font-medium text-muted-foreground">
                    经验总结:
                  </label>
                  <Textarea
                    id="lessonsLearned"
                    name="lessonsLearned"
                    value={(form.lessonsLearned as string) ?? ""}
                    onChange={(e) => {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors["lessonsLearned"];
                        return newErrors;
                      });
                      handleSelectChange("lessonsLearned", e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="h-16 flex justify-end">
            {/* <LoadingButton loading={loading} editTrade={editTrade} errors={errors} /> */}
          </div>
        </form>
      </div>
    );
  }
);

// 设置 displayName 属性，用于开发调试
TradeForm.displayName = "TradeForm";

// 兼容性导出，方便老代码引用
export { TradeForm as TradeFormDialog };
export default TradeForm;
