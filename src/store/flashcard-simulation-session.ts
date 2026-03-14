import type { FlashcardCard } from "@/app/trade/flashcard/types";

const FLASHCARD_SIMULATION_SESSION_KEY = "flashcard-simulation-session";

export type FlashcardSimulationSession = {
  simulationSessionId: string;
  cards: FlashcardCard[];
  count: number;
  startedAt: string;
};

export function saveFlashcardSimulationSession(session: FlashcardSimulationSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    FLASHCARD_SIMULATION_SESSION_KEY,
    JSON.stringify(session),
  );
}

export function getFlashcardSimulationSession(): FlashcardSimulationSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(FLASHCARD_SIMULATION_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as FlashcardSimulationSession;
    if (!Array.isArray(parsed.cards)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFlashcardSimulationSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(FLASHCARD_SIMULATION_SESSION_KEY);
}
