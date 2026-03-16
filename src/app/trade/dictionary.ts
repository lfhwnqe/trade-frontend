import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type { DictionaryTagItem } from "./config";

async function fetchDictionaryOptions(categoryCode: string): Promise<DictionaryTagItem[]> {
  const res = await fetchWithAuth("/api/proxy-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    proxyParams: {
      targetPath: `dictionary/options/${categoryCode}`,
      actualMethod: "GET",
    },
    actualBody: {},
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data && (data.userMessage || data.message || data.error)) ||
        "获取字典失败",
    );
  }

  const payload =
    data && typeof data === "object" && "data" in data
      ? (data as Record<string, unknown>).data
      : data;
  const payloadRecord =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const itemsValue = payloadRecord.items;
  const items = Array.isArray(itemsValue)
    ? (itemsValue as Array<Record<string, unknown>>)
    : [];

  return items
    .map((item) => ({
      code: typeof item.code === "string" ? item.code : "",
      label:
        typeof item.label === "string"
          ? item.label
          : typeof item.code === "string"
            ? item.code
            : "",
      color: typeof item.color === "string" ? item.color : undefined,
      status: "ACTIVE",
    }))
    .filter((item) => item.code);
}

export async function fetchTradeTagOptions(): Promise<DictionaryTagItem[]> {
  return fetchDictionaryOptions("trade_tag");
}

export async function fetchFlashcardTagOptions(): Promise<DictionaryTagItem[]> {
  return fetchDictionaryOptions("flashcard_tag");
}
