import { create } from "zustand";
import { generateMatches, getRecommendedMatches } from "../services/matchApi";
import type { StudentMatch } from "../types/match";

interface MatchState {
  matches: StudentMatch[];
  status: "idle" | "loading" | "ready" | "generating" | "error";
  error: string | null;
  loadMatches: () => Promise<void>;
  refreshMatches: () => Promise<void>;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  status: "idle",
  error: null,

  loadMatches: async () => {
    set({ status: "loading", error: null });
    try {
      const { matches } = await getRecommendedMatches();
      set({ matches, status: "ready" });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Unable to load matches" });
    }
  },

  refreshMatches: async () => {
    set({ status: "generating", error: null });
    try {
      const { matches } = await generateMatches();
      set({ matches, status: "ready" });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Unable to generate matches" });
    }
  }
}));

