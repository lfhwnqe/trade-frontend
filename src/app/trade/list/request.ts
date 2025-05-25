import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Trade, TradeListResponse, TradeQuery } from "../config";

// 允许的图片类型
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
];

// 图片资源类型定义
export interface ImageResource {
  key: string;
  url: string;
}

export async function fetchTrades(params: {
  page: number;
  pageSize: number;
  query?: Omit<TradeQuery, "dateTimeRange"> & { dateTimeRange?: string };
}): Promise<TradeListResponse> {
  const { page, pageSize, query } = params;
  const proxyParams = {
    targetPath: "trade/list",
    actualMethod: "POST",
  };
  const actualBody = {
    page,
    limit: pageSize,
    ...query,
  };
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new Error((data && data.message) || "获取交易列表失败");
  }
  const data = await res.json();
  return {
    items: data.data?.items || [],
    total: data.data?.total || 0,
    page: data.data?.page || page,
    pageSize: data.data?.pageSize || pageSize,
    totalPages: data.data?.totalPages || 1,
  };
}

export type CreateTradeDto = {
  dateTimeRange: string;
  marketStructure: string;
  signalType: string;
  vah?: number;
  val?: number;
  poc?: number;
  entryDirection: "Long" | "Short" | "";
  entry?: number;
  stopLoss?: number;
  target?: number;
  volumeProfileImage: string;
  hypothesisPaths: string[];
  actualPath: string;
  profitLoss?: number;
  rr: string;
  analysisError: string;
  executionMindsetScore?: number;
  improvement: string;
};

/**
 * toDto: 将前端表单 Trade 对象映射为后端 DTO CreateTradeDto 格式
 * 完全覆盖后端结构：状态、图片组、计划对象等全部处理
 */
export function toDto(form: Partial<Trade>): any {
  // 数值安全转换
  function parseNum(v: any) {
    if (v === undefined || v === "" || v === null) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }

  // 图片组类型转换 ImageResource[]，或空数组
  function asImageArray(val: any): { key: string, url: string }[] {
    if (Array.isArray(val)) return val.filter(x => x && typeof x.url === "string" && typeof x.key === "string");
    return [];
  }

  // 计划对象转换
  function asEntryPlan(obj: any): any {
    if (!obj || typeof obj !== "object") return undefined;
    const { entryReason, entrySignal, exitSignal } = obj;
    if (!entryReason && !entrySignal && !exitSignal) return undefined;
    return {
      entryReason: entryReason ?? "",
      entrySignal: entrySignal ?? "",
      exitSignal: exitSignal ?? "",
    };
  }

  // 枚举、布尔、文本处理
  const tradeResultMap = { PROFIT: "盈利", LOSS: "亏损", BREAKEVEN: "保本" };
  const statusVal = form.status ?? "ANALYZED";

  return {
    // ===== 交易状态 =====
    status: statusVal,
    // ===== 入场前分析 =====
    volumeProfileImages: asImageArray(form.volumeProfileImages),
    poc: parseNum(form.poc),
    val: parseNum(form.val),
    vah: parseNum(form.vah),
    keyPriceLevels: form.keyPriceLevels ?? "",
    marketStructure: form.marketStructure ?? "",
    marketStructureAnalysis: form.marketStructureAnalysis ?? "",
    expectedPathImages: asImageArray(form.expectedPathImages),
    expectedPathAnalysis: form.expectedPathAnalysis ?? "",
    entryPlanA: asEntryPlan(form.entryPlanA),
    entryPlanB: asEntryPlan(form.entryPlanB),
    entryPlanC: asEntryPlan(form.entryPlanC),
    // ===== 入场记录 =====
    entryPrice: parseNum(form.entry),
    entryTime: form.entryTime ?? "",
    entryDirection: form.entryDirection ?? "",
    stopLoss: parseNum(form.stopLoss),
    takeProfit: parseNum(form.takeProfit),
    entryReason: form.entryReason ?? "",
    exitReason: form.exitReason ?? "",
    mentalityNotes: form.mentalityNotes ?? "",
    // ===== 离场后分析 =====
    exitPrice: parseNum(form.exitPrice),
    exitTime: form.exitTime ?? "",
    tradeResult: form.tradeResult ?? "",
    followedPlan: !!form.followedPlan,
    followedPlanId: form.followedPlanId ?? "",
    actualPathImages: asImageArray(form.actualPathImages),
    actualPathAnalysis: form.actualPathAnalysis ?? "",
    remarks: form.remarks ?? "",
    lessonsLearned: form.lessonsLearned ?? "",
    analysisImages: [], // 预留，当前表单暂未填
    profitLossPercentage: parseNum(form.profitLossPercentage),
    riskRewardRatio: form.riskRewardRatio ?? "",
  };
}

export async function createTrade(data: Partial<CreateTradeDto>) {
  const proxyParams = {
    targetPath: "trade",
    actualMethod: "POST",
  };
  const actualBody = data;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "新建失败");
  return resData;
}

export async function updateTrade(id: string, data: Partial<CreateTradeDto>) {
  const proxyParams = {
    targetPath: `trade/${id}`,
    actualMethod: "PATCH",
  };
  const actualBody = data;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "更新失败");
  return resData;
}

export async function deleteTrade(id: string) {
  const proxyParams = {
    targetPath: `trade/${id}`,
    actualMethod: "DELETE",
  };
  const actualBody = {};
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "删除失败");
  return resData;
}

/**
 * 获取图片上传URL
 * @param params 上传参数
 * @returns 上传URL和文件键值
 */
export async function getImageUploadUrl(params: {
  fileName: string;
  fileType: string;
  date: string;
}): Promise<{ uploadUrl: string; key: string }> {
  const proxyParams = {
    targetPath: "image/upload-url",
    actualMethod: "POST",
  };
  const actualBody = params;
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "获取上传URL失败");
  return {
    uploadUrl: data.data.uploadUrl,
    key: data.data.key,
  };
}

/**
 * 直接上传文件到S3
 * @param uploadUrl 上传URL
 * @param file 文件对象
 */
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });
  
  if (!res.ok) {
    throw new Error("上传到S3失败");
  }
}
