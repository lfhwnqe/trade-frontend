"use client";

import * as React from "react";
import { useCallback, useEffect, Suspense, useRef } from "react";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import {
  formAtom,
  loadingAtom,
  detailLoadingAtom,
  formInitialState,
} from "./atom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createTrade,
  toDto,
  fetchTradeDetail,
  updateTrade,
} from "../list/request";
import { Trade, TradeStatus, tradeStatusOptions } from "../config";
import type { ImageResource } from "../config";
import {
  TradeFormDialog,
  TradeFormRef,
} from "../list/components/TradeFormDialog";
import { useAlert } from "@/components/common/alert";
import { LoadingButton } from "../components/LoadingButton";
import { Button } from "@/components/ui/button";

type EntryPlan = {
  entryReason?: string;
  entrySignal?: string;
  exitSignal?: string;
};

const LOCAL_DRAFT_STORAGE_KEY = "trade-add-draft";
/**
 * 新增交易页面
 * 复用 TradeFormDialog，独立页逻辑
 */
export default function TradeAddPage({
  className,
  readOnly = false,
  enableChecklist = true,
}: {
  className?: string;
  readOnly?: boolean;
  enableChecklist?: boolean;
}) {
  const [success, errorAlert] = useAlert();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm, resetForm] = useAtomImmer(formAtom);
  const [loading, setLoading] = useAtomImmer(loadingAtom);
  const [detailLoading, setDetailLoading] = useAtomImmer(detailLoadingAtom);
  // 主体渲染，非弹窗模式而是全宽居中大表单
  const id = searchParams.get("id");
  const isCreateMode = !id;

  // 新增时固定为已分析状态，避免跨状态填写
  useEffect(() => {
    if (!isCreateMode) {
      return;
    }
    setForm((draft) => {
      if (!draft.status) {
        draft.status = TradeStatus.ANALYZED;
      }
    });
  }, [isCreateMode, setForm]);

  // 详情回填逻辑
  useEffect(() => {
    if (id) {
      setDetailLoading(true);
      fetchTradeDetail(id)
        .then((data) => {
          // 合并已有字段，防止丢失自定义初值
          setForm((draft) => {
            Object.assign(draft, data);
          });
        })
        .catch((e) => {
          errorAlert("加载详情失败：" + (e && e.message ? e.message : e));
        })
        .finally(() => {
          setDetailLoading(false);
        });
    }
  }, []);
  // }, [searchParams, errorAlert, setDetailLoading, setForm]);

  // 离开页面时自动重置表单，避免脏数据
  useEffect(() => {
    return () => {
      resetForm(formInitialState);
    };
  }, [resetForm]);

  // 本地暂存恢复
  useEffect(() => {
    if (id || typeof window === "undefined") {
      return;
    }
    try {
      const draft = window.localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as Partial<Trade>;
        setForm((draftState) => {
          Object.assign(draftState, parsed);
        });
      }
    } catch (err) {
      console.error("Failed to restore local draft", err);
    }
  }, [id, setForm]);

  // 提交函数 - 添加节流控制避免重复提交
  const submittingRef = useRef(false);
  // 创建对表单组件的引用
  const formRef = useRef<TradeFormRef>(null);
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // 如果已经在提交中，则直接返回
      if (submittingRef.current || loading) {
        return;
      }

      // 设置提交状态
      submittingRef.current = true;
      setLoading(true);

      const id = searchParams.get("id");
      try {
        if (id) {
          await updateTrade(id, toDto(form));
          success("更新成功");
        } else {
          await createTrade(toDto(form));
          success("新建成功");
        }
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(LOCAL_DRAFT_STORAGE_KEY);
        }
        router.push("/trade/list");
      } catch (error: unknown) {
        if (typeof error === "object" && error && "message" in error) {
          errorAlert(
            (error as { message?: string }).message ||
              (id ? "更新失败" : "创建失败"),
          );
        } else {
          errorAlert(id ? "更新失败" : "创建失败");
        }
      } finally {
        setLoading(false);
        // 重置提交状态
        submittingRef.current = false;
      }
    },
    [form, router, searchParams, success, errorAlert, loading],
  );

  // 字段变化处理
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draft[name] =
        type === "number" ? (value === "" ? "" : Number(value)) : value;
    });
  }, []);

  // Select 类型变化
  const handleSelectChange = useCallback((key: keyof Trade, value: string) => {
    setForm((draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draft[key] = value as any;
    });
  }, []);

  // 时间区间/日期变化
  const handleDateRangeChange = useCallback(
    (dateRange: import("react-day-picker").DateRange | undefined) => {
      setForm((draft) => {
        draft["entryTime"] = dateRange?.from
          ? dateRange.from.toISOString()
          : undefined;
        draft["exitTime"] = dateRange?.to
          ? dateRange.to.toISOString()
          : undefined;
      });
    },
    [],
  );

  // 图片
  const handleImageChange = useCallback(
    (key: string, value: ImageResource[]) => {
      setForm((draft) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draft[key] = value as any;
      });
    },
    [],
  );

  // 计划字段
  const handlePlanChange = useCallback((key: string, value: EntryPlan) => {
    setForm((draft) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draft[key] = value as any;
    });
  }, []);

  // 支持底层 updateForm 合并对象
  const updateForm = useCallback((patch: Partial<Trade>) => {
    console.log("updateForm", patch);
    setForm((draft) => {
      Object.assign(draft, patch);
    });
  }, []);

  const handleSaveDraft = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        LOCAL_DRAFT_STORAGE_KEY,
        JSON.stringify(form),
      );
      success("已暂存到本地");
    } catch (err) {
      console.error("Failed to save local draft", err);
      errorAlert("暂存失败，请稍后重试");
    }
  }, [form, success, errorAlert]);

  const pageTitle = readOnly ? "交易详情" : "新增/编辑交易记录";

  return (
    <Suspense fallback={<div>加载中...</div>}>
      <div
        className={
          "relative min-h-screen bg-[#000000] text-[#ededed] antialiased " +
          (className ?? "")
        }
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-72 w-2/3 rounded-full bg-emerald-400/10 blur-[140px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-500/10 blur-[150px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_45%)]" />
        </div>

        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-full items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* <div className="flex items-center space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-[#18181b] to-black border border-white/10">
                <span className="text-[11px] font-semibold text-[#6366f1]">
                  T
                </span>
              </div>
              <div>
                <h1 className="text-sm font-semibold uppercase tracking-wide text-white">
                  TradeOS
                </h1>
                <span className="text-xs font-mono tracking-tight text-[#a1a1aa]">
                  Pre-Trade Module
                </span>
              </div>
            </div> */}
            <div className="hidden items-center rounded-full border border-white/10 bg-black/40 p-1 md:flex">
              {tradeStatusOptions.map((option) => {
                const isActive = form.status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectChange("status", option.value)}
                    className={
                      "rounded-full px-4 py-1.5 text-xs font-medium transition-all " +
                      (isActive
                        ? "bg-[#6366f1] text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                        : "text-[#a1a1aa] hover:text-white")
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {/* <div className="flex items-center space-x-4">
              <span className="rounded border border-[#6366f1]/30 bg-[#6366f1]/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#6366f1]">
                {isCreateMode ? "Draft" : "Saved"}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0f0f10]">
                <span className="text-xs text-[#a1a1aa]">ME</span>
              </div>
            </div> */}
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
          <div className="md:hidden">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">
              Trade Status
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-white/10 bg-[#0f0f10] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:ring-[#6366f1]"
                value={(form.status as string) ?? ""}
                onChange={(event) =>
                  handleSelectChange("status", event.target.value)
                }
              >
                {tradeStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#a1a1aa]">
                <span className="text-sm">▾</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            {/* <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl"> */}
            <div>
              <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
              <p className="mt-1 text-xs font-mono text-[#a1a1aa]">
                交易 ID: {id ? `#${id}` : "新交易"}
              </p>
            </div>
          </div>

          <TradeFormDialog
            ref={formRef}
            editTrade={id ? form : null}
            form={form}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleDateRangeChange={handleDateRangeChange}
            handleImageChange={handleImageChange}
            handlePlanChange={handlePlanChange}
            handleSubmit={handleSubmit}
            updateForm={updateForm}
            loading={loading}
            readOnly={readOnly}
            showChecklist={enableChecklist}
            formMode="distributed"
          />
          {(loading || detailLoading) && (
            <div className="text-center text-sm text-[#a1a1aa]">
              {loading ? "保存中..." : "加载详情中..."}
            </div>
          )}

          {!readOnly && (
            <div className="flex items-center justify-end gap-4 rounded-2xl border border-white/10 bg-black/30 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleSaveDraft}
                className="border-white/20 bg-white/5 text-[#a1a1aa] transition-colors hover:bg-white/10 hover:text-white"
              >
                暂存本地
              </Button>
              <LoadingButton
                loading={loading}
                editTrade={form}
                errors={{}}
                className="bg-[#6366f1] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#4f46e5] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                onSubmit={() => {
                  // 直接调用表单组件的 submit 方法
                  formRef.current?.submit();
                }}
              />
            </div>
          )}
        </main>
      </div>
    </Suspense>
  );
}
