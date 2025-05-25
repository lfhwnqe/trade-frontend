import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type {
  EntryDirection,
  EntryPlan,
  Trade,
  TradeListResponse,
  TradeQuery,
  TradeStatus,
  MarketStructure,
  ImageResource,
} from "../config";

// 允许的图片类型
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// 图片资源类型定义

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


/** 获取单条交易详情 */
export async function fetchTradeDetail(transactionId: string): Promise<Trade> {
  const proxyParams = {
    targetPath: `trade/${transactionId}`,
    actualMethod: "GET"
  };
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: {},
  });
  if (!res.ok) throw new Error("获取详情失败");
  // 兼容 response 结构
  const data = await res.json();
  return data.data || data;
}
/** 交易结果枚举，与后端同步 */
export enum TradeResult {
  PROFIT = "盈利",
  LOSS = "亏损",
  BREAKEVEN = "保本",
}

/**
 * CreateTradeDto 类型，对齐后端 CreateTradeDto （所有字段类型与必选/可选严格一致，见后端 dto 和 entity 注释）
 */
export type CreateTradeDto = {
  // ===== 交易状态 =====
  status: TradeStatus;

  // ===== 入场前分析 =====
  volumeProfileImages: ImageResource[];
  poc: number;
  val: number;
  vah: number;
  keyPriceLevels?: string;
  marketStructure: MarketStructure;
  marketStructureAnalysis: string;
  expectedPathImages?: ImageResource[];
  expectedPathAnalysis?: string;
  entryPlanA: EntryPlan;
  entryPlanB?: EntryPlan;
  entryPlanC?: EntryPlan;

  // ===== 入场记录 =====
  entryPrice?: number;
  entryTime?: string;
  entryDirection?: EntryDirection;
  stopLoss?: number;
  takeProfit?: number;
  entryReason?: string;
  exitReason?: string;
  mentalityNotes?: string;

  // ===== 离场后分析 =====
  exitPrice?: number;
  exitTime?: string;
  tradeResult?: TradeResult;
  followedPlan?: boolean;
  followedPlanId?: string;
  actualPathImages?: ImageResource[];
  actualPathAnalysis?: string;
  remarks?: string;
  lessonsLearned?: string;
  analysisImages?: ImageResource[];

  // ===== 基础字段 =====
  profitLossPercentage?: number;
  riskRewardRatio?: string;
};

/**
 * toDto: 将前端表单 Trade 对象映射为后端 DTO CreateTradeDto 格式
 * 完全覆盖后端结构：状态、图片组、计划对象等全部处理
 */
/**
 * toDto: 表单 Trade -> 后端 CreateTradeDto
 * 保证所有字段严格对齐，类型安全转换
 */
export function toDto(form: Partial<Trade>): CreateTradeDto {
  const parseNum = (v: string | number | undefined) =>
    v === undefined || v === "" || v === null ? undefined : (isNaN(Number(v)) ? undefined : Number(v));
  const asImageArray = (val?: ImageResource[]) =>
    Array.isArray(val)
      ? val.filter((x) => x && typeof x.url === "string" && typeof x.key === "string")
      : [];

  return {
    // ===== 交易状态 =====
    status: form.status!,
    // ===== 入场前分析 =====
    volumeProfileImages: asImageArray(form.volumeProfileImages),
    poc: parseNum(form.poc)!,
    val: parseNum(form.val)!,
    vah: parseNum(form.vah)!,
    keyPriceLevels: form.keyPriceLevels,
    marketStructure: form.marketStructure!,
    marketStructureAnalysis: form.marketStructureAnalysis || "",
    expectedPathImages: asImageArray(form.expectedPathImages),
    expectedPathAnalysis: form.expectedPathAnalysis,
    entryPlanA: form.entryPlanA ?? { entryReason: "", entrySignal: "", exitSignal: "" },
    entryPlanB: form.entryPlanB,
    entryPlanC: form.entryPlanC,

    // ===== 入场记录 =====
    entryPrice: parseNum(form.entry),
    entryTime: form.entryTime,
    entryDirection: form.entryDirection,
    stopLoss: parseNum(form.stopLoss),
    takeProfit: parseNum(form.takeProfit),
    entryReason: form.entryReason,
    exitReason: form.exitReason,
    mentalityNotes: form.mentalityNotes,

    // ===== 离场后分析 =====
    exitPrice: parseNum(form.exitPrice),
    exitTime: form.exitTime,
    tradeResult: form.tradeResult as TradeResult | undefined,
    followedPlan: form.followedPlan,
    followedPlanId: form.followedPlanId,
    actualPathImages: asImageArray(form.actualPathImages),
    actualPathAnalysis: form.actualPathAnalysis,
    remarks: form.remarks,
    lessonsLearned: form.lessonsLearned,
    analysisImages: asImageArray(form.analysisImages),

    // ===== 计算字段/可选 =====
    profitLossPercentage: parseNum(form.profitLossPercentage),
    riskRewardRatio: form.riskRewardRatio,
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
