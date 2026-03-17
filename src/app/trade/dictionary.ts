import { fetchWithAuth } from "@/utils/fetchWithAuth";
import type { DictionaryTagItem } from "./config";

const DICTIONARY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DICTIONARY_CACHE_PREFIX = "trade-dictionary-options";

type DictionaryOptionsCachePayload = {
  items: DictionaryTagItem[];
  fetchedAt: number;
  expiresAt: number;
};

function getDictionaryCacheKey(categoryCode: string) {
  return `${DICTIONARY_CACHE_PREFIX}:${categoryCode}`;
}

function normalizeDictionaryItems(items: Array<Record<string, unknown>>): DictionaryTagItem[] {
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
      status:
        typeof item.status === "string" && item.status.trim()
          ? item.status.trim()
          : "ACTIVE",
    }))
    .filter((item) => item.code);
}

function readDictionaryCache(categoryCode: string): DictionaryTagItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getDictionaryCacheKey(categoryCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DictionaryOptionsCachePayload | null;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    if (typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(getDictionaryCacheKey(categoryCode));
      return null;
    }
    return parsed.items;
  } catch {
    return null;
  }
}

function writeDictionaryCache(categoryCode: string, items: DictionaryTagItem[]) {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const payload: DictionaryOptionsCachePayload = {
      items,
      fetchedAt: now,
      expiresAt: now + DICTIONARY_CACHE_TTL_MS,
    };
    window.localStorage.setItem(getDictionaryCacheKey(categoryCode), JSON.stringify(payload));
  } catch {
    // ignore cache write failure
  }
}

async function fetchDictionaryOptions(categoryCode: string): Promise<DictionaryTagItem[]> {
  const cachedItems = readDictionaryCache(categoryCode);
  if (cachedItems) {
    return cachedItems;
  }

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
    ? normalizeDictionaryItems(itemsValue as Array<Record<string, unknown>>)
    : [];

  writeDictionaryCache(categoryCode, items);
  return items;
}

export function getDictionaryItemLabelByCode(
  items: DictionaryTagItem[],
  code: string,
): DictionaryTagItem | null {
  return items.find((item) => item.code === code) || null;
}

export async function fetchTradeTagOptions(): Promise<DictionaryTagItem[]> {
  return fetchDictionaryOptions("trade_tag");
}

export async function fetchFlashcardTagOptions(): Promise<DictionaryTagItem[]> {
  return fetchDictionaryOptions("flashcard_tag");
}
