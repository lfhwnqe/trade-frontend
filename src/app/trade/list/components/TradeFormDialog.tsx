"use client";

import * as React from "react";
import { DateCalendarPicker } from "../../../../components/common/DateCalendarPicker";
import { ImageUploader } from "../../../../components/common/ImageUploader";
import { MarketStructureAnalysisImages } from "./MarketStructureAnalysisImages";
import type {
  ImageResource,
  MarketStructureAnalysisImage,
  Trade,
} from "../../config";
import {
  ANALYSIS_PERIOD_PRESETS,
  ChecklistState,
  TRADE_PERIOD_PRESETS,
  TradeStatus,
  entryDirectionOptions,
  marketStructureOptions,
  planOptions,
  tradeGradeOptions,
  tradeResultOptions,
  tradeTypeOptions,
} from "../../config";
import { Input as BaseInput } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select as BaseSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { DateRange } from "react-day-picker";
import { Textarea as BaseTextarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/common/alert";
import { Star } from "lucide-react";

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
  readOnly?: boolean;
  showChecklist?: boolean;
  formMode?: "full" | "distributed";
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
  readOnly,
}: {
  value?: EntryPlan;
  onChange: (v: EntryPlan) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="block pb-1 text-sm font-medium text-muted-foreground">
          入场理由
        </label>
        <BaseTextarea
          readOnly={readOnly}
          value={value?.entryReason ?? ""}
          onChange={(e) => onChange({ ...value, entryReason: e.target.value })}
          placeholder="请输入入场理由"
          className="min-h-[80px]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="block pb-1 text-sm font-medium text-muted-foreground">
          入场信号
        </label>
        <BaseTextarea
          readOnly={readOnly}
          value={value?.entrySignal ?? ""}
          onChange={(e) => onChange({ ...value, entrySignal: e.target.value })}
          placeholder="请输入入场信号"
          className="min-h-[80px]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="block pb-1 text-sm font-medium text-muted-foreground">
          退出信号
        </label>
        <BaseTextarea
          readOnly={readOnly}
          value={value?.exitSignal ?? ""}
          onChange={(e) => onChange({ ...value, exitSignal: e.target.value })}
          placeholder="请输入退出信号"
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

function StarRating({
  value = 0,
  onChange,
  readOnly,
  id,
}: {
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="flex w-fit items-center gap-2 rounded-xl border border-white/10 dark:bg-input/30 p-4"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            className="group p-0.5 transition-transform active:scale-95 disabled:cursor-not-allowed cursor-pointer"
            onClick={() => onChange?.(star)}
            disabled={readOnly}
            aria-label={`评分 ${star} 星`}
            aria-pressed={active}
          >
            <Star
              className={`h-6 w-6 transition-all ${
                active
                  ? "text-yellow-500 drop-shadow-[0_0_6px_rgba(250,204,21,0.45)]"
                  : "text-yellow-500/50"
              }`}
              fill={active ? "currentColor" : "none"}
            />
            {/* <Star
              className={`h-6 w-6 transition-all ${
                active
                  ? "text-yellow-500 drop-shadow-[0_0_6px_rgba(250,204,21,0.45)]"
                  : "text-[#18181b] group-hover:text-yellow-500/50"
              }`}
              fill={active ? "currentColor" : "none"}
            /> */}
          </button>
        );
      })}
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
      readOnly = false,
      showChecklist = true,
      formMode = "full",
    },
    ref,
  ) => {
    const [, errorAlert] = useAlert();
    const inputProps = React.useMemo(
      () => (readOnly ? { readOnly: true } : {}),
      [readOnly],
    );
    const textareaProps = React.useMemo(
      () => (readOnly ? { readOnly: true } : {}),
      [readOnly],
    );
    const selectProps = React.useMemo(
      () => (readOnly ? { disabled: true } : {}),
      [readOnly],
    );
    // 错误信息状态
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    // 创建自定义的表单更新处理函数，在更新表单数据的同时清除相应字段的错误
    const handleFormChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (readOnly) return;
        // 清除当前字段的错误提示
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[e.target.name];
          return newErrors;
        });
        // 调用原始的handleChange函数
        handleChange(e);
      },
      [handleChange, readOnly],
    );

    // 创建自定义的选择更新处理函数
    const handleFormSelectChange = React.useCallback(
      (key: keyof Trade, value: string) => {
        if (readOnly) return;
        // 清除当前字段的错误提示
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key as string];
          return newErrors;
        });
        // 调用原始的handleSelectChange函数
        handleSelectChange(key, value);
      },
      [handleSelectChange, readOnly],
    );

    // 创建自定义的表单更新函数
    const handleFormUpdate = React.useCallback(
      (patch: Partial<Trade>) => {
        if (readOnly) return;
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
      [updateForm, readOnly],
    );

    const handleChecklistChange = React.useCallback(
      (key: keyof ChecklistState, checked: boolean | "indeterminate") => {
        if (readOnly) return;
        // 入场前检查清单仅在待入场状态下填写
        handleFormUpdate({
          checklist: {
            ...(form.checklist ?? {}),
            [key]: checked === true,
          },
        });
      },
      [form.checklist, handleFormUpdate, readOnly],
    );

    const isDistributed = formMode === "distributed";
    const statusRank: Record<TradeStatus, number> = {
      [TradeStatus.ANALYZED]: 1,
      [TradeStatus.WAITING]: 2,
      [TradeStatus.ANALYZED_NOT_ENTERED]: 2,
      [TradeStatus.ENTERED]: 3,
      [TradeStatus.EXITED]: 4,
      [TradeStatus.EARLY_EXITED]: 4,
    };
    const currentRank = form.status ? statusRank[form.status] : 0;
    const shouldShowSection = (target: TradeStatus) =>
      !isDistributed || currentRank >= statusRank[target];
    const sectionProps = {
      readOnly,
      inputProps,
      textareaProps,
      selectProps,
    };
    const analyzedSection = sectionProps;
    const waitingSection = sectionProps;
    const enteredSection = sectionProps;
    const exitedSection = sectionProps;
    const shouldRequirePreEntryRating =
      !!form.status &&
      statusRank[form.status] >= statusRank[TradeStatus.WAITING];

    const marketStructureImages = React.useMemo(() => {
      const raw = form.trendAnalysisImages;
      if (!Array.isArray(raw)) return [];
      return raw
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          if ("image" in item) {
            const image = (item as { image?: ImageResource }).image;
            if (
              !image ||
              typeof image.url !== "string" ||
              typeof image.key !== "string"
            ) {
              return null;
            }
            const title =
              "title" in item && typeof item.title === "string"
                ? item.title
                : "";
            const analysis =
              "analysis" in item && typeof item.analysis === "string"
                ? item.analysis
                : "";
            return { image, title, analysis };
          }
          if ("url" in item && "key" in item) {
            const url =
              typeof (item as { url?: unknown }).url === "string"
                ? (item as { url: string }).url
                : "";
            const key =
              typeof (item as { key?: unknown }).key === "string"
                ? (item as { key: string }).key
                : "";
            if (!url || !key) return null;
            return { image: { url, key }, title: "", analysis: "" };
          }
          return null;
        })
        .filter(
          (item): item is MarketStructureAnalysisImage => item !== null,
        );
    }, [form.trendAnalysisImages]);

    const analysisSectionBlock = shouldShowSection(TradeStatus.ANALYZED) ? (
      <section className="space-y-2">
        <h3 className="mb-6 flex items-center gap-2 text-sm font-medium text-white">
          <span className="h-4 w-1 rounded-full bg-emerald-500" />
          入场前分析
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-6 gap-y-4 mb-2">
          {/* 行情分析时间 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              行情分析时间
              <span className="ml-0.5 text-destructive">*</span>:
            </label>
            <DateCalendarPicker
              disabled={analyzedSection.readOnly}
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
          {/* 分析周期 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              分析周期:
            </label>
            <BaseInput
              {...analyzedSection.inputProps}
              id="analysisPeriod"
              name="analysisPeriod"
              list="analysis-period-presets"
              value={(form.analysisPeriod as string) ?? ""}
              onChange={(e) =>
                handleFormSelectChange("analysisPeriod", e.target.value)
              }
              placeholder="可选择或输入其他周期"
            />
            <datalist id="analysis-period-presets">
              {ANALYSIS_PERIOD_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
          </div>
          {/* 交易标的 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              交易标的<span className="ml-0.5 text-destructive">*</span>:
            </label>
            <BaseInput
              {...analyzedSection.inputProps}
              id="tradeSubject"
              name="tradeSubject"
                list="trade-subject-presets"
              value={(form.tradeSubject as string) ?? ""}
              onChange={handleFormChange}
              className={errors.tradeSubject ? "border-destructive" : ""}
            />
            <datalist id="trade-subject-presets">
              {TRADE_PERIOD_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
            {errors.tradeSubject && (
              <p className="text-sm text-destructive mt-1">
                {errors.tradeSubject}
              </p>
            )}
          </div>
          {/* 交易类型 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              交易类型<span className="ml-0.5 text-destructive">*</span>:
            </label>
            <BaseSelect
              {...analyzedSection.selectProps}
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
            </BaseSelect>
            {errors.tradeType && (
              <p className="text-sm text-destructive mt-1">
                {errors.tradeType}
              </p>
            )}
          </div>
          {/* 市场结构 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              市场结构<span className="ml-0.5 text-destructive">*</span>:
            </label>
            <BaseSelect
              {...analyzedSection.selectProps}
              name="marketStructure"
              value={(form.marketStructure as string) ?? ""}
              onValueChange={(value) =>
                handleFormSelectChange("marketStructure" as keyof Trade, value)
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
            </BaseSelect>
            {errors.marketStructure && (
              <p className="text-sm text-destructive mt-1">
                {errors.marketStructure}
              </p>
            )}
          </div>

          <div className="col-span-full" />
          {/* 结构分析 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              结构分析:
            </label>
            <BaseTextarea
              {...analyzedSection.textareaProps}
              id="marketStructureAnalysis"
              name="marketStructureAnalysis"
              value={(form.marketStructureAnalysis as string) ?? ""}
              onChange={(e) =>
                handleSelectChange("marketStructureAnalysis", e.target.value)
              }
            />
          </div>
          {/* 关键价位说明 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              关键价位说明:
            </label>
            <BaseTextarea
              {...analyzedSection.textareaProps}
              id="keyPriceLevels"
              name="keyPriceLevels"
              value={(form.keyPriceLevels as string) ?? ""}
              onChange={(e) =>
                handleSelectChange("keyPriceLevels", e.target.value)
              }
            />
          </div>
          {/* 入场前分析总结 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              入场前分析总结:
            </label>
            <BaseTextarea
              {...analyzedSection.textareaProps}
              id="preEntrySummary"
              name="preEntrySummary"
              value={(form.preEntrySummary as string) ?? ""}
              onChange={(e) =>
                handleSelectChange("preEntrySummary", e.target.value)
              }
            />
          </div>
          {/* 入场前分析评分 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              入场前分析评分
              {shouldRequirePreEntryRating && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <StarRating
              id="preEntrySummaryImportance"
              value={form.preEntrySummaryImportance ?? 0}
              readOnly={analyzedSection.readOnly}
              onChange={(value) =>
                handleFormUpdate({ preEntrySummaryImportance: value })
              }
            />
            {errors.preEntrySummaryImportance && (
              <p className="text-sm text-destructive mt-1">
                {errors.preEntrySummaryImportance}
              </p>
            )}
          </div>
          {/* 成交量分布图 */}
          <div className="col-span-3">
            <MarketStructureAnalysisImages
              readOnly={analyzedSection.readOnly}
              value={marketStructureImages}
              onChange={(items) =>
                handleFormUpdate({ trendAnalysisImages: items })
              }
              max={10}
            />
          </div>
          {/* 假设路径图 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              假设路径图：
            </label>
            <ImageUploader
              disabled={analyzedSection.readOnly}
              value={
                Array.isArray(form.expectedPathImages) &&
                (form.expectedPathImages as unknown[]).every(
                  (v) => typeof v === "object" && v !== null && "url" in v,
                )
                  ? (form.expectedPathImages as unknown as ImageResource[])
                  : []
              }
              onChange={(imgs) => handleImageChange("expectedPathImages", imgs)}
              max={5}
            />
          </div>
        </div>
      </section>
    ) : null;

    const waitingPlanBlock = shouldShowSection(TradeStatus.WAITING) ? (
      <section className="space-y-2">
        <h3 className="mb-6 flex items-center gap-2 text-sm font-medium text-white">
          <span className="h-4 w-1 rounded-full bg-emerald-500" />
          入场计划
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
          {/* 入场计划A */}
          <div>
            <div className="font-semibold text-base mb-2 text-muted-foreground">
              A 计划
            </div>
            <EntryPlanForm
              value={form.entryPlanA as EntryPlan}
              onChange={(v) => handlePlanChange("entryPlanA", v)}
              readOnly={waitingSection.readOnly}
            />
          </div>
          {/* 入场计划B */}
          <div>
            <div className="font-semibold text-base mb-2 text-muted-foreground">
              B 计划
            </div>
            <EntryPlanForm
              value={form.entryPlanB as EntryPlan}
              onChange={(v) => handlePlanChange("entryPlanB", v)}
              readOnly={waitingSection.readOnly}
            />
          </div>
          {/* 入场计划C */}
          <div>
            <div className="font-semibold text-base mb-2 text-muted-foreground">
              C 计划
            </div>
            <EntryPlanForm
              value={form.entryPlanC as EntryPlan}
              onChange={(v) => handlePlanChange("entryPlanC", v)}
              readOnly={waitingSection.readOnly}
            />
          </div>
        </div>
      </section>
    ) : null;

    const waitingChecklistBlock =
      showChecklist && shouldShowSection(TradeStatus.WAITING) ? (
        <section className="space-y-2">
          <h3 className="mb-6 flex items-center gap-2 text-sm font-medium text-white">
            <span className="h-4 w-1 rounded-full bg-emerald-500" />
            入场前检查
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={!!form.checklist?.phaseAnalysis}
                onCheckedChange={(checked) =>
                  handleChecklistChange("phaseAnalysis", checked)
                }
                disabled={waitingSection.readOnly}
              />
              阶段分析：判断当前行情所处阶段（震荡/趋势）
            </label>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={!!form.checklist?.rangeAnalysis}
                onCheckedChange={(checked) =>
                  handleChecklistChange("rangeAnalysis", checked)
                }
                disabled={waitingSection.readOnly}
              />
              震荡阶段：关键阻力点、VWAP 位置、威科夫区间边缘与小溪测试行为
            </label>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={!!form.checklist?.trendAnalysis}
                onCheckedChange={(checked) =>
                  handleChecklistChange("trendAnalysis", checked)
                }
                disabled={waitingSection.readOnly}
              />
              趋势阶段：最近高成交量节点（可能回调测试点/入场价格）
            </label>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={!!form.checklist?.riskRewardCheck}
                onCheckedChange={(checked) =>
                  handleChecklistChange("riskRewardCheck", checked)
                }
                disabled={waitingSection.readOnly}
              />
              盈亏比计算是否完成
            </label>
          </div>
        </section>
      ) : null;

    const analyzedNotEnteredSectionBlock =
      form.status === TradeStatus.ANALYZED_NOT_ENTERED ? (
        <section className="space-y-2">
          <h3 className="mb-6 flex items-center gap-2 text-sm font-medium text-white">
            <span className="h-4 w-1 rounded-full bg-emerald-500" />
            未入场
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-6 gap-y-4">
            {/* 实际路径图 */}
            <div className="col-span-full">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                实际路径图：
              </label>
              <ImageUploader
                disabled={exitedSection.readOnly}
                value={
                  Array.isArray(form.actualPathImages) &&
                  (form.actualPathImages as unknown[]).every(
                    (v) => typeof v === "object" && v !== null && "url" in v,
                  )
                    ? (form.actualPathImages as unknown as ImageResource[])
                    : []
                }
                onChange={(imgs) => handleImageChange("actualPathImages", imgs)}
                max={10}
              />
            </div>
            {/* 实际路径复盘 */}
            <div className="col-span-3">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                实际路径复盘:
              </label>
              <BaseTextarea
                {...exitedSection.textareaProps}
                id="actualPathAnalysis"
                name="actualPathAnalysis"
                value={(form.actualPathAnalysis as string) ?? ""}
                onChange={(e) =>
                  handleSelectChange("actualPathAnalysis", e.target.value)
                }
              />
            </div>
            {/* 经验总结 */}
            <div className="col-span-3">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                经验总结:
              </label>
              <BaseTextarea
                {...exitedSection.textareaProps}
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
            {/* 经验总结评分 */}
            <div className="col-span-3">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                经验总结评分:
              </label>
              <StarRating
                id="lessonsLearnedImportance"
                value={form.lessonsLearnedImportance ?? 0}
                readOnly={exitedSection.readOnly}
                onChange={(value) =>
                  handleFormUpdate({ lessonsLearnedImportance: value })
                }
              />
              {errors.lessonsLearnedImportance && (
                <p className="text-sm text-destructive mt-1">
                  {errors.lessonsLearnedImportance}
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null;

    const entrySectionBlock = shouldShowSection(TradeStatus.ENTERED) ? (
      <section className="space-y-2">
        <h3 className="mb-6 flex items-center gap-2 text-sm font-medium text-white">
          <span className="h-4 w-1 rounded-full bg-emerald-500" />
          入场记录
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-6 gap-y-4">
          {/* 入场方向 - 只在已入场/已离场时必填 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              入场方向
              {(form.status === TradeStatus.ENTERED ||
                form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseSelect
              {...enteredSection.selectProps}
              name="entryDirection"
              value={(form.entryDirection as string) ?? ""}
              onValueChange={(value) =>
                handleFormSelectChange("entryDirection" as keyof Trade, value)
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
            </BaseSelect>
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
                form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseInput
              {...enteredSection.inputProps}
              id="entry"
              name="entry"
              type="number"
              value={(form.entry as string) ?? ""}
              onChange={handleFormChange}
              className={errors.entry ? "border-destructive" : ""}
            />
            {errors.entry && (
              <p className="text-sm text-destructive mt-1">{errors.entry}</p>
            )}
          </div>
          {/* 入场时间 */}
          <div className="col-span-2">
            <div className="relative pb-1">
              <label className="text-sm font-medium text-muted-foreground">
                入场时间
                {(form.status === TradeStatus.ENTERED ||
                  form.status === TradeStatus.EXITED ||
                  form.status === TradeStatus.EARLY_EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              {!!form.analysisTime && !enteredSection.readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-7 px-2 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                  onClick={() =>
                    handleFormUpdate({ entryTime: form.analysisTime })
                  }
                >
                  回填行情分析时间
                </Button>
              )}
            </div>
            <DateCalendarPicker
              disabled={enteredSection.readOnly}
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
                form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseInput
              {...enteredSection.inputProps}
              id="stopLoss"
              name="stopLoss"
              type="number"
              value={(form.stopLoss as string) ?? ""}
              onChange={handleFormChange}
              className={errors.stopLoss ? "border-destructive" : ""}
            />
            {errors.stopLoss && (
              <p className="text-sm text-destructive mt-1">{errors.stopLoss}</p>
            )}
          </div>
          {/* 止盈点 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              止盈点
              {(form.status === TradeStatus.ENTERED ||
                form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseInput
              {...enteredSection.inputProps}
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
                form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseTextarea
              {...enteredSection.textareaProps}
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
          {/* 入场分析图 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              入场分析图:
            </label>
            <ImageUploader
              disabled={enteredSection.readOnly}
              value={
                Array.isArray(form.entryAnalysisImages) &&
                (form.entryAnalysisImages as unknown[]).every(
                  (v) => typeof v === "object" && v !== null && "url" in v,
                )
                  ? (form.entryAnalysisImages as unknown as ImageResource[])
                  : []
              }
              onChange={(imgs) => handleImageChange("entryAnalysisImages", imgs)}
              max={10}
            />
          </div>
          {/* 离场理由 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              离场理由
              {(form.status === TradeStatus.ENTERED ||
                form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseTextarea
              {...enteredSection.textareaProps}
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
                form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseTextarea
              {...enteredSection.textareaProps}
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
              className={errors.mentalityNotes ? "border-destructive" : ""}
            />
            {errors.mentalityNotes && (
              <p className="text-sm text-destructive mt-1">
                {errors.mentalityNotes}
              </p>
            )}
          </div>
        </div>
      </section>
    ) : null;

    const exitSectionBlock = shouldShowSection(TradeStatus.EXITED) ? (
      <section className="space-y-2">
        <h3 className="mb-6 flex items-center gap-2 text-sm font-medium text-white">
          <span className="h-4 w-1 rounded-full bg-emerald-500" />
          离场后分析
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-6 gap-y-4">
          {/* 离场价格 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              离场价格
              {(form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseInput
              {...exitedSection.inputProps}
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
            <div className="relative pb-1">
              <label className="text-sm font-medium text-muted-foreground">
                离场时间
                {(form.status === TradeStatus.EXITED ||
                  form.status === TradeStatus.EARLY_EXITED) && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
                :
              </label>
              {!!form.analysisTime && !exitedSection.readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-7 px-2 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                  onClick={() =>
                    handleFormUpdate({ exitTime: form.analysisTime })
                  }
                >
                  回填行情分析时间
                </Button>
              )}
            </div>
            <DateCalendarPicker
              disabled={exitedSection.readOnly}
              analysisTime={form.exitTime}
              updateForm={(patch) =>
                handleFormUpdate({ exitTime: patch.analysisTime })
              }
            />
            {errors.exitTime && (
              <p className="text-sm text-destructive mt-1">{errors.exitTime}</p>
            )}
          </div>
          {/* 交易结果 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              交易结果
              {(form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseSelect
              {...exitedSection.selectProps}
              name="tradeResult"
              value={(form.tradeResult as string) ?? ""}
              onValueChange={(value) =>
                handleFormSelectChange("tradeResult" as keyof Trade, value)
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
            </BaseSelect>
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
              {(form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <BaseSelect
              {...exitedSection.selectProps}
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
            </BaseSelect>
          </div>
          {/* 计划ID */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              计划类型
              {(form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) &&
                !!form.followedPlan && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
              :
            </label>
            <BaseSelect
              {...exitedSection.selectProps}
              name="followedPlanId"
              value={(form.followedPlanId as string) ?? ""}
              onValueChange={(value) =>
                handleFormSelectChange("followedPlanId" as keyof Trade, value)
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
            </BaseSelect>
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
            <BaseInput
              {...exitedSection.inputProps}
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
            <BaseInput
              {...exitedSection.inputProps}
              id="riskRewardRatio"
              name="riskRewardRatio"
              type="text"
              value={(form.riskRewardRatio as string) ?? ""}
              onChange={handleFormChange}
            />
          </div>
          {/* 交易分级 */}
          <div className="col-span-2">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              交易分级
            </label>
            <BaseSelect
              {...exitedSection.selectProps}
              name="grade"
              value={(form.grade as string) ?? ""}
              onValueChange={(value) => handleFormSelectChange("grade", value)}
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
            </BaseSelect>
          </div>
          {/* 分析是否过期 */}
          <div className="col-span-2 flex items-center">
            <input
              id="analysisExpired"
              type="checkbox"
              className="mr-2"
              checked={!!form.analysisExpired}
              disabled={exitedSection.readOnly}
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
          {/* 实际路径图 */}
          <div className="col-span-full">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              实际路径图：
            </label>
            <ImageUploader
              disabled={exitedSection.readOnly}
              value={
                Array.isArray(form.actualPathImages) &&
                (form.actualPathImages as unknown[]).every(
                  (v) => typeof v === "object" && v !== null && "url" in v,
                )
                  ? (form.actualPathImages as unknown as ImageResource[])
                  : []
              }
              onChange={(imgs) => handleImageChange("actualPathImages", imgs)}
              max={10}
            />
          </div>
          {/* 实际路径复盘 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              实际路径复盘:
            </label>
            <BaseTextarea
              {...exitedSection.textareaProps}
              id="actualPathAnalysis"
              name="actualPathAnalysis"
              value={(form.actualPathAnalysis as string) ?? ""}
              onChange={(e) =>
                handleSelectChange("actualPathAnalysis", e.target.value)
              }
            />
          </div>
          {form.status === TradeStatus.EARLY_EXITED && (
            <div className="col-span-3">
              <label className="block pb-1 text-sm font-medium text-muted-foreground">
                提前离场原因:
              </label>
              <BaseTextarea
                {...exitedSection.textareaProps}
                id="earlyExitReason"
                name="earlyExitReason"
                value={(form.earlyExitReason as string) ?? ""}
                onChange={(e) => {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors["earlyExitReason"];
                    return newErrors;
                  });
                  handleSelectChange("earlyExitReason", e.target.value);
                }}
                className={errors.earlyExitReason ? "border-destructive" : ""}
              />
              {errors.earlyExitReason && (
                <p className="text-sm text-destructive mt-1">
                  {errors.earlyExitReason}
                </p>
              )}
            </div>
          )}
          {/* 备注 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              备注:
            </label>
            <BaseTextarea
              {...exitedSection.textareaProps}
              id="remarks"
              name="remarks"
              value={(form.remarks as string) ?? ""}
              onChange={(e) => handleSelectChange("remarks", e.target.value)}
            />
          </div>
          {/* 经验总结 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              经验总结:
            </label>
            <BaseTextarea
              {...exitedSection.textareaProps}
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
          {/* 经验总结评分 */}
          <div className="col-span-3">
            <label className="block pb-1 text-sm font-medium text-muted-foreground">
              经验总结评分
              {(form.status === TradeStatus.EXITED ||
                form.status === TradeStatus.EARLY_EXITED) && (
                <span className="ml-0.5 text-destructive">*</span>
              )}
              :
            </label>
            <StarRating
              id="lessonsLearnedImportance"
              value={form.lessonsLearnedImportance ?? 0}
              readOnly={exitedSection.readOnly}
              onChange={(value) =>
                handleFormUpdate({ lessonsLearnedImportance: value })
              }
            />
            {errors.lessonsLearnedImportance && (
              <p className="text-sm text-destructive mt-1">
                {errors.lessonsLearnedImportance}
              </p>
            )}
          </div>
        </div>
      </section>
    ) : null;

    // 验证表单
    const validateForm = () => {
      if (readOnly) return true;
      const newErrors: Record<string, string> = {};

      // 交易状态必填
      if (!form.status) {
        newErrors.status = "交易状态为必填项";
      }

      // 分布表单下，仅已分析状态要求填写入场前分析信息
      if (!isDistributed || form.status === TradeStatus.ANALYZED) {
        if (!form.analysisTime) {
          newErrors.analysisTime = "行情分析时间为必填项";
        }

        if (!form.tradeSubject) {
          newErrors.tradeType = "交易标的为必填项";
        }

        if (!form.tradeType) {
          newErrors.tradeType = "交易类型为必填项";
        }

        if (!form.marketStructure) {
          newErrors.marketStructure = "市场结构为必填项";
        }
      }

      const requiresPreEntryRating =
        !!form.status &&
        statusRank[form.status] >= statusRank[TradeStatus.WAITING];
      if (requiresPreEntryRating && !form.preEntrySummaryImportance) {
        newErrors.preEntrySummaryImportance = "入场前分析评分为必填项";
      }

      // 根据交易状态验证必填字段
      if (
        form.status === TradeStatus.ENTERED ||
        form.status === TradeStatus.EXITED ||
        form.status === TradeStatus.EARLY_EXITED
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
      if (
        form.status === TradeStatus.EXITED ||
        form.status === TradeStatus.EARLY_EXITED
      ) {
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

        if (!form.lessonsLearnedImportance) {
          newErrors.lessonsLearnedImportance = "经验总结评分为必填项";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // 包装提交处理函数
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (readOnly) {
        return;
      }

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
          `表单有 ${errorCount} 个必填项未填写，请检查标记为红色的字段。`,
        );
      }
    };

    // 暴露组件方法
    React.useImperativeHandle(ref, () => ({
      submit: () => {
        if (readOnly) {
          return;
        }
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
            Object.keys(errors)[0],
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
            `表单有 ${errorCount} 个必填项未填写，请检查标记为红色的字段。`,
          );
        }
      },
    }));

    const sectionBlocks = [
      exitSectionBlock,
      entrySectionBlock,
      analyzedNotEnteredSectionBlock,
      waitingPlanBlock,
      waitingChecklistBlock,
      analysisSectionBlock,
    ].filter(Boolean) as React.ReactElement[];

    return (
      <div className="flex flex-1 flex-col">
        {/* <div className="w-full flex-1 flex flex-col mx-auto  bg-muted/50"> */}
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1">
          <div className="flex flex-1 flex-col gap-y-6">
            <div className="rounded-2xl border border-white/10 bg-[rgba(15,15,16,0.7)] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              {sectionBlocks.map((block, index) => (
                <div key={block.key ?? index}>
                  {index > 0 && (
                    <div className="my-8 h-px w-full bg-white/10" />
                  )}
                  {block}
                </div>
              ))}
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="h-16 flex justify-end">
            {/* <LoadingButton loading={loading} editTrade={editTrade} errors={errors} /> */}
          </div>
        </form>
      </div>
    );
  },
);

// 设置 displayName 属性，用于开发调试
TradeForm.displayName = "TradeForm";

// 兼容性导出，方便老代码引用
export { TradeForm as TradeFormDialog };
export default TradeForm;
