import { create } from "zustand";
import { createRoadmap, listRoadmaps } from "../services/roadmapApi";
import type { Roadmap } from "../types/roadmap";

interface RoadmapState {
  roadmaps: Roadmap[];
  status: "idle" | "loading" | "ready" | "generating" | "error";
  error: string | null;
  loadRoadmaps: () => Promise<void>;
  generateRoadmap: (desiredCareer: string) => Promise<Roadmap>;
}

export const useRoadmapStore = create<RoadmapState>((set) => ({
  roadmaps: [],
  status: "idle",
  error: null,
  loadRoadmaps: async () => {
    set({ status: "loading", error: null });
    try {
      const { roadmaps } = await listRoadmaps();
      set({ roadmaps, status: "ready" });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Unable to load roadmaps" });
    }
  },
  generateRoadmap: async (desiredCareer) => {
    set({ status: "generating", error: null });
    try {
      const { roadmap } = await createRoadmap(desiredCareer);
      set((state) => ({ roadmaps: [roadmap, ...state.roadmaps], status: "ready" }));
      return roadmap;
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Unable to generate roadmap" });
      throw error;
    }
  }
}));

