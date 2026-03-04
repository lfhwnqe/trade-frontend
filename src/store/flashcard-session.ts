import type { FlashcardCard, FlashcardFilters } from "@/app/trade/flashcard/types";

const FLASHCARD_SESSION_KEY = "flashcard-drill-session";

export type FlashcardDrillSession = {
  cards: FlashcardCard[];
  filters?: FlashcardFilters;
  count: number;
  startedAt: string;
};

export function saveFlashcardSession(session: FlashcardDrillSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(FLASHCARD_SESSION_KEY, JSON.stringify(session));
}

export function getFlashcardSession(): FlashcardDrillSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(FLASHCARD_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as FlashcardDrillSession;
    if (!Array.isArray(parsed.cards)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFlashcardSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(FLASHCARD_SESSION_KEY);
}
