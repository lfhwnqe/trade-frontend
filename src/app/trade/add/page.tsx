"use client";

import * as React from "react";
import { useCallback, useEffect } from "react";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { formAtom, loadingAtom, detailLoadingAtom } from "./atom";
import { useRouter, useSearchParams } from "next/navigation";
import { createTrade, toDto, fetchTradeDetail, updateTrade } from "../list/request";
import { Trade } from "../config";
import type { ImageResource } from "../config";
import { TradeFormDialog } from "../list/components/TradeFormDialog";

/**
 * 新增交易页面
 * 复用 TradeFormDialog，独立页逻辑
 */
export default function TradeAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useAtomImmer(formAtom);
  const [loading, setLoading] = useAtomImmer(loadingAtom);
  const [detailLoading, setDetailLoading] = useAtomImmer(detailLoadingAtom);

  // 详情回填逻辑
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setDetailLoading(true);
      fetchTradeDetail(id)
        .then((data) => {
          // 合并已有字段，防止丢失自定义初值
          setForm(draft => {
            Object.assign(draft, data);
          });
        })
        .catch((e) => {
          alert("加载详情失败：" + (e && e.message ? e.message : e));
        })
        .finally(() => {
          setDetailLoading(false);
        });
    }
  }, [searchParams]);

  // 提交函数
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      const id = searchParams.get("id");
      try {
        if (id) {
          await updateTrade(id, toDto(form));
          alert("更新成功");
        } else {
          await createTrade(toDto(form));
          alert("新建成功");
        }
        router.push("/trade/list");
      } catch (error: unknown) {
        if (typeof error === "object" && error && "message" in error) {
          alert((error as { message?: string }).message || (id ? "更新失败" : "创建失败"));
        } else {
          alert(id ? "更新失败" : "创建失败");
        }
      } finally {
        setLoading(false);
      }
    },
    [form, router, searchParams]
  );

  // 字段变化处理
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(draft => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draft[name] = type === "number" ? (value === "" ? "" : Number(value)) : value;
    });
  }, []);

  // Select 类型变化
  const handleSelectChange = useCallback((key: keyof Trade, value: string) => {
    setForm(draft => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draft[key] = value as any;
    });
  }, []);

  // 时间区间/日期变化
  const handleDateRangeChange = useCallback(
    (dateRange: import("react-day-picker").DateRange | undefined) => {
      setForm(draft => {
        draft["entryTime"] = dateRange?.from ? dateRange.from.toISOString() : undefined;
        draft["exitTime"] = dateRange?.to ? dateRange.to.toISOString() : undefined;
      });
    },
    []
  );

  // 图片
  const handleImageChange = useCallback(
    (key: string, value: ImageResource[]) => {
      setForm(draft => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        draft[key] = value as any;
      });
    },
    []
  );

  // 计划字段
  const handlePlanChange = useCallback((key: string, value: EntryPlan) => {
    setForm(draft => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draft[key] = value as any;
    });
  }, []);

  type EntryPlan = {
    entryReason?: string;
    entrySignal?: string;
    exitSignal?: string;
  };

  // 支持底层 updateForm 合并对象
  const updateForm = useCallback((patch: Partial<Trade>) => {
    console.log("updateForm", patch);
    setForm(draft => {
      Object.assign(draft, patch);
    });
  }, []);

  // 主体渲染，非弹窗模式而是全宽居中大表单
  return (
    <div className="flex flex-col items-center justify-center min-h-[92vh]">
      <div className="w-full bg-white rounded-lg shadowborder flex flex-col">
        {/* 固定顶部 */}
        <div className="sticky top-0 z-10 bg-white shadow px-6 py-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">新增/编辑交易记录</h1>
        </div>
        {/* 滚动表单内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <TradeFormDialog
            editTrade={null}
            form={form}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleDateRangeChange={handleDateRangeChange}
            handleImageChange={handleImageChange}
            handlePlanChange={handlePlanChange}
            handleSubmit={handleSubmit}
            updateForm={updateForm}
          />
          {(loading || detailLoading) && (
            <div className="mt-4 text-center text-gray-500">
              {loading ? "保存中..." : "加载详情中..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
