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
import { Trade } from "../config";
import type { ImageResource } from "../config";
import {
  TradeFormDialog,
  TradeFormRef,
} from "../list/components/TradeFormDialog";
import { useAlert } from "@/components/common/alert";
import { LoadingButton } from "../components/LoadingButton";

type EntryPlan = {
  entryReason?: string;
  entrySignal?: string;
  exitSignal?: string;
};
/**
 * 新增交易页面
 * 复用 TradeFormDialog，独立页逻辑
 */
export default function TradeAddPage({
  className,
}: {
  className?: string;
}) {
  const [success, errorAlert] = useAlert();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm, resetForm] = useAtomImmer(formAtom);
  const [loading, setLoading] = useAtomImmer(loadingAtom);
  const [detailLoading, setDetailLoading] = useAtomImmer(detailLoadingAtom);
  // 主体渲染，非弹窗模式而是全宽居中大表单
  const id = searchParams.get("id");

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
        router.push("/trade/list");
      } catch (error: unknown) {
        if (typeof error === "object" && error && "message" in error) {
          errorAlert(
            (error as { message?: string }).message ||
              (id ? "更新失败" : "创建失败")
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
    [form, router, searchParams, success, errorAlert, loading]
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
    []
  );

  // 图片
  const handleImageChange = useCallback(
    (key: string, value: ImageResource[]) => {
      setForm((draft) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draft[key] = value as any;
      });
    },
    []
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

  return (
    <Suspense fallback={<div>加载中...</div>}>
      <div className={  "w-full flex-1 flex flex-col  rounded-lg shadowborder h-full " + className}>
        {/* 固定顶部 */}
        <div className="h-16 bg-white shadow px-6 py-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">新增/编辑交易记录</h1>
        </div>
        {/* 滚动表单内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
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
          />
          {(loading || detailLoading) && (
            <div className="mt-4 text-center text-gray-500">
              {loading ? "保存中..." : "加载详情中..."}
            </div>
          )}
        </div>
        <div className="pt-4 flex justify-end shadow-gray-400 shadow-2xl">
          <LoadingButton
            loading={loading}
            editTrade={form}
            errors={{}}
            onSubmit={() => {
              // 直接调用表单组件的 submit 方法
              formRef.current?.submit();
            }}
          />
        </div>
      </div>
    </Suspense>
  );
}
