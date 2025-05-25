"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTrade, toDto, fetchTradeDetail } from "../list/request";
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
  const [form, setForm] = useState<Partial<Trade>>({
    status: undefined, // 需选
    marketStructure: undefined, // 需选
    volumeProfileImages: [],
    expectedPathImages: [],
    entryPlanA: { entryReason: "", entrySignal: "", exitSignal: "" },
    entryPlanB: { entryReason: "", entrySignal: "", exitSignal: "" },
    entryPlanC: { entryReason: "", entrySignal: "", exitSignal: "" },
    // 其它字段默认空即可
  });
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // 详情回填逻辑
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setDetailLoading(true);
      fetchTradeDetail(id)
        .then((data) => {
          // 合并已有字段，防止丢失自定义初值
          setForm((prev) => ({
            ...prev,
            ...data,
          }));
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
      try {
        await createTrade(toDto(form));
        alert("新建成功");
        router.push("/trade/list"); // 也可根据实际路由为 /trade
      } catch (error: unknown) {
        if (typeof error === "object" && error && "message" in error) {
          alert((error as { message?: string }).message || "创建失败");
        } else {
          alert("创建失败");
        }
      } finally {
        setLoading(false);
      }
    },
    [form, router]
  );

  // 字段变化处理
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  }, []);

  // Select 类型变化
  const handleSelectChange = useCallback((key: keyof Trade, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 时间区间/日期变化
  const handleDateRangeChange = useCallback(
    (dateRange: import("react-day-picker").DateRange | undefined) => {
      setForm((prev) => ({
        ...prev,
        entryTime: dateRange?.from ? dateRange.from.toISOString() : undefined,
        exitTime: dateRange?.to ? dateRange.to.toISOString() : undefined,
      }));
    },
    []
  );

  // 图片
  const handleImageChange = useCallback(
    (key: string, value: ImageResource[]) => {
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // 计划字段
  const handlePlanChange = useCallback((key: string, value: EntryPlan) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  type EntryPlan = {
    entryReason?: string;
    entrySignal?: string;
    exitSignal?: string;
  };

  // 支持底层 updateForm 合并对象
  const updateForm = useCallback((patch: Partial<Trade>) => {
    setForm((prev) => ({
      ...prev,
      ...patch,
    }));
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
