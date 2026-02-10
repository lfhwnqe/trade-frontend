import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { TradeStatus } from "../config";
import type {
  EntryDirection,
  EntryPlan,
  ChecklistState,
  Trade,
  TradeListResponse,
  TradeQuery,
  MarketStructure,
  ImageResource,
  MarketStructureAnalysisImage,
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
type TradeDetailResponse = Trade & {
  entryPrice?: number | string | null;
};

function normalizeTradeDetail(detail: TradeDetailResponse): Trade {
  const { entryPrice, ...rest } = detail;
  const normalizeEntry = (value: unknown) =>
    value === undefined || value === null || value === ""
      ? undefined
      : `${value}`;
  const normalizeTags = (value: unknown) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const tags = value
        .map((item) => `${item}`.trim())
        .filter((item) => item.length > 0);
      return tags.length > 0 ? Array.from(new Set(tags)) : undefined;
    }
    if (typeof value === "string") {
      const tags = value
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      return tags.length > 0 ? Array.from(new Set(tags)) : undefined;
    }
    return undefined;
  };

  const entryFromPayload = normalizeEntry(rest.entry);
  const entryFromPrice = normalizeEntry(entryPrice);

  return {
    ...rest,
    // 详情接口返回 entryPrice，但表单字段使用 entry，缺省时回填 entryPrice
    entry: entryFromPayload ?? entryFromPrice,
    tradeTags: normalizeTags(rest.tradeTags),
  };
}

export async function fetchTradeDetail(transactionId: string): Promise<Trade> {
  const proxyParams = {
    targetPath: `trade/${transactionId}`,
    actualMethod: "GET",
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
  const detail = (data.data || data) as TradeDetailResponse;
  return normalizeTradeDetail(detail);
}

export async function fetchSharedTradeDetail(shareId: string): Promise<Trade> {
  const proxyParams = {
    targetPath: `trade/shared/${shareId}`,
    actualMethod: "GET",
  };
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: {},
  });
  if (!res.ok) throw new Error("获取分享详情失败");
  const data = await res.json();
  const detail = (data.data || data) as TradeDetailResponse;
  return normalizeTradeDetail(detail);
}

type ShareInfo = {
  transactionId?: string;
  isShareable?: boolean;
  shareId?: string;
};

export async function shareTrade(transactionId: string): Promise<ShareInfo> {
  const proxyParams = {
    targetPath: `trade/${transactionId}/share`,
    actualMethod: "POST",
  };
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "分享失败");
  return (data.data || data) as ShareInfo;
}

export async function updateTradeShareable(
  transactionId: string,
  isShareable: boolean,
): Promise<ShareInfo> {
  const proxyParams = {
    targetPath: `trade/${transactionId}/shareable`,
    actualMethod: "PATCH",
  };
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody: { isShareable },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "更新分享状态失败");
  return (data.data || data) as ShareInfo;
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
  // ===== 交易类型 =====
  tradeType: string;
  // ===== 交易状态 =====
  status: TradeStatus;

  // ===== 入场前分析 =====
  analysisTime?: string;
  analysisPeriod?: string;
  volumeProfileImages?: ImageResource[];
  marketStructureAnalysisImages?: MarketStructureAnalysisImage[];
  trendAnalysisImages?: MarketStructureAnalysisImage[];
  tradeSubject: string;
  keyPriceLevels?: string;
  marketStructure: MarketStructure;
  marketStructureAnalysis: string;
  preEntrySummary?: string;
  preEntrySummaryImportance?: number;
  tradeTags?: string[];
  expectedPathImages?: ImageResource[];
  expectedPathImagesDetailed?: MarketStructureAnalysisImage[];
  expectedPathAnalysis?: string;
  entryPlanA: EntryPlan;
  entryPlanB?: EntryPlan;
  entryPlanC?: EntryPlan;
  checklist?: ChecklistState;

  // ===== 入场记录 =====
  entryPrice?: number;
  entryTime?: string;
  entryDirection?: EntryDirection;
  stopLoss?: number;
  takeProfit?: number;
  entryReason?: string;
  entryAnalysisImages?: ImageResource[];
  entryAnalysisImagesDetailed?: MarketStructureAnalysisImage[];
  followedSystemStrictly?: boolean;
  exitReason?: string;
  earlyExitReason?: string;
  mentalityNotes?: string;

  // ===== 离场后分析 =====
  exitPrice?: number;
  exitTime?: string;
  tradeResult?: TradeResult;
  followedPlan?: boolean;
  followedPlanId?: string;
  actualPathImages?: ImageResource[];
  actualPathImagesDetailed?: MarketStructureAnalysisImage[];
  actualPathAnalysis?: string;
  remarks?: string;
  lessonsLearned?: string;
  lessonsLearnedImportance?: number;
  analysisImages?: ImageResource[];
  analysisImagesDetailed?: MarketStructureAnalysisImage[];

  // ===== 基础字段 =====
  profitLossPercentage?: number;
  riskRewardRatio?: string;

  // ===== R 模型字段 =====
  riskModelVersion?: string;
  plannedRiskAmount?: number;
  plannedRiskPct?: number;
  plannedRiskPerUnit?: number;
  plannedRewardPerUnit?: number;
  plannedRR?: number;
  realizedR?: number;
  rEfficiency?: number;
  exitDeviationR?: number;
  maxFavorableExcursionR?: number;
  maxAdverseExcursionR?: number;
  exitType?: "TP" | "SL" | "MANUAL" | "TIME" | "FORCED";
  exitQualityTag?: "TECHNICAL" | "EMOTIONAL" | "SYSTEM" | "UNKNOWN";
  exitReasonCode?: string;
  exitReasonNote?: string;
  rMetricsReady?: boolean;

  // 新增
  grade?: string;
  analysisExpired?: boolean;
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
    v === undefined || v === "" || v === null
      ? undefined
      : isNaN(Number(v))
      ? undefined
      : Number(v);
  const asImageArray = (val?: ImageResource[]) =>
    Array.isArray(val)
      ? val.filter(
          (x) => x && typeof x.url === "string" && typeof x.key === "string"
        )
      : [];
  const asMarketStructureImages = (
    val?: unknown,
  ): MarketStructureAnalysisImage[] =>
    Array.isArray(val)
      ? val
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
          .filter((item): item is MarketStructureAnalysisImage => !!item)
      : [];
  const normalizeChecklist = (value?: ChecklistState) => {
    if (!value) {
      return undefined;
    }
    return {
      phaseAnalysis: !!value.phaseAnalysis,
      rangeAnalysis: !!value.rangeAnalysis,
      trendAnalysis: !!value.trendAnalysis,
      riskRewardCheck: !!value.riskRewardCheck,
    };
  };
  const normalizeTags = (value?: unknown): string[] | undefined => {
    if (!value) return undefined;
    const raw =
      typeof value === "string"
        ? value.split(/[,，]/)
        : Array.isArray(value)
          ? value
          : [];
    const tags = raw
      .map((item) => `${item}`.trim())
      .filter((item) => item.length > 0);
    if (tags.length === 0) return undefined;
    return Array.from(new Set(tags));
  };

  return {
    analysisTime: form.analysisTime,
    analysisPeriod: form.analysisPeriod,
    // ===== 交易类型 =====
    tradeType: form.tradeType!,
    // ===== 交易状态 =====
    status: form.status!,
    // ===== 入场前分析 =====
    tradeSubject: form.tradeSubject!,
    volumeProfileImages: asImageArray(form.volumeProfileImages),
    marketStructureAnalysisImages: asMarketStructureImages(
      form.marketStructureAnalysisImages,
    ),
    trendAnalysisImages: asMarketStructureImages(form.trendAnalysisImages),
    keyPriceLevels: form.keyPriceLevels,
    marketStructure: form.marketStructure!,
    marketStructureAnalysis: form.marketStructureAnalysis || "",
    preEntrySummary: form.preEntrySummary,
    preEntrySummaryImportance: parseNum(form.preEntrySummaryImportance),
    tradeTags: normalizeTags(form.tradeTags),
    expectedPathImages: asImageArray(form.expectedPathImages),
    expectedPathImagesDetailed: asMarketStructureImages(
      form.expectedPathImagesDetailed,
    ),
    expectedPathAnalysis: form.expectedPathAnalysis,
    entryPlanA: form.entryPlanA ?? {
      entryReason: "",
      entrySignal: "",
      exitSignal: "",
    },
    entryPlanB: form.entryPlanB,
    entryPlanC: form.entryPlanC,
    // 仅待入场状态需要提交入场前检查清单
    checklist:
      form.status === TradeStatus.WAITING
        ? normalizeChecklist(form.checklist)
        : undefined,

    // ===== 入场记录 =====
    entryPrice: parseNum(form.entry),
    entryTime: form.entryTime,
    entryDirection: form.entryDirection,
    stopLoss: parseNum(form.stopLoss),
    takeProfit: parseNum(form.takeProfit),
    entryReason: form.entryReason,
    entryAnalysisImages: asImageArray(form.entryAnalysisImages),
    entryAnalysisImagesDetailed: asMarketStructureImages(
      form.entryAnalysisImagesDetailed,
    ),
    followedSystemStrictly: form.followedSystemStrictly,
    exitReason: form.exitReason,
    earlyExitReason: form.earlyExitReason,
    mentalityNotes: form.mentalityNotes,

    // ===== 离场后分析 =====
    exitPrice: parseNum(form.exitPrice),
    exitTime: form.exitTime,
    tradeResult: form.tradeResult as TradeResult | undefined,
    followedPlan: form.followedPlan,

    // 新增扩展字段
    grade: form.grade,
    analysisExpired: !!form.analysisExpired,
    followedPlanId: form.followedPlanId,
    actualPathImages: asImageArray(form.actualPathImages),
    actualPathImagesDetailed: asMarketStructureImages(
      form.actualPathImagesDetailed,
    ),
    actualPathAnalysis: form.actualPathAnalysis,
    remarks: form.remarks,
    lessonsLearned: form.lessonsLearned,
    lessonsLearnedImportance: parseNum(form.lessonsLearnedImportance),
    analysisImages: asImageArray(form.analysisImages),
    analysisImagesDetailed: asMarketStructureImages(
      form.analysisImagesDetailed,
    ),

    // ===== 计算字段/可选 =====
    profitLossPercentage: parseNum(form.profitLossPercentage),
    riskRewardRatio: form.riskRewardRatio,

    // ===== R 模型 =====
    riskModelVersion: form.riskModelVersion,
    plannedRiskAmount: parseNum(form.plannedRiskAmount),
    plannedRiskPct: parseNum(form.plannedRiskPct),
    plannedRiskPerUnit: parseNum(form.plannedRiskPerUnit),
    plannedRewardPerUnit: parseNum(form.plannedRewardPerUnit),
    plannedRR: parseNum(form.plannedRR),
    realizedR: parseNum(form.realizedR),
    rEfficiency: parseNum(form.rEfficiency),
    exitDeviationR: parseNum(form.exitDeviationR),
    maxFavorableExcursionR: parseNum(form.maxFavorableExcursionR),
    maxAdverseExcursionR: parseNum(form.maxAdverseExcursionR),
    exitType: form.exitType as CreateTradeDto["exitType"],
    exitQualityTag: form.exitQualityTag as CreateTradeDto["exitQualityTag"],
    exitReasonCode: form.exitReasonCode,
    exitReasonNote: form.exitReasonNote,
    rMetricsReady: form.rMetricsReady,

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
 * 复制交易记录
 * @param id 要复制的交易ID
 * @returns 复制后的新交易记录
 */
export async function copyTrade(id: string) {
  const proxyParams = {
    targetPath: `trade/${id}/copy`,
    actualMethod: "POST",
  };
  const actualBody = {};
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams,
    actualBody,
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || "复制失败");
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
