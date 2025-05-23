import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { Trade, TradeListResponse, TradeQuery } from "../config";

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

export function toDto(form: Partial<Trade>): Partial<CreateTradeDto> {
  function parseNum(v: string | undefined) {
    return v === undefined || v === "" ? undefined : Number(v);
  }
  return {
    dateTimeRange: form.dateTimeRange ?? "",
    marketStructure: form.marketStructure ?? "",
    signalType: form.signalType ?? "",
    entryDirection: (form.entryDirection ?? "") as "Long" | "Short" | "",
    vah: parseNum(form.vah),
    val: parseNum(form.val),
    poc: parseNum(form.poc),
    entry: parseNum(form.entry),
    stopLoss: parseNum(form.stopLoss),
    target: parseNum(form.target),
    volumeProfileImage: form.volumeProfileImage ?? "",
    hypothesisPaths: Array.isArray(form.hypothesisPaths)
      ? form.hypothesisPaths
      : typeof form.hypothesisPaths === "string"
      ? (form.hypothesisPaths as string).split(",").map((s: string) => s.trim())
      : [],
    actualPath: form.actualPath ?? "",
    profitLoss: parseNum(form.profitLoss),
    rr: form.rr ?? "",
    analysisError: form.analysisError ?? "",
    executionMindsetScore: parseNum(form.executionMindsetScore),
    improvement: form.improvement ?? "",
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
