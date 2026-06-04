import { create } from "zustand";
import { createHackathonTeam, listHackathonTeams } from "../services/hackathonTeamApi";
import type { HackathonTeam, HackathonTeamPayload } from "../types/hackathonTeam";

interface HackathonTeamState {
  teams: HackathonTeam[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  loadTeams: (params?: Record<string, string | number | undefined>) => Promise<void>;
  createTeam: (payload: HackathonTeamPayload) => Promise<HackathonTeam>;
}

export const useHackathonTeamStore = create<HackathonTeamState>((set) => ({
  teams: [],
  status: "idle",
  error: null,
  loadTeams: async (params = {}) => {
    set({ status: "loading", error: null });
    try {
      const { teams } = await listHackathonTeams(params);
      set({ teams, status: "ready" });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Unable to load teams" });
    }
  },
  createTeam: async (payload) => {
    set({ status: "loading", error: null });
    const { team } = await createHackathonTeam(payload);
    set((state) => ({ teams: [team, ...state.teams], status: "ready" }));
    return team;
  }
}));

