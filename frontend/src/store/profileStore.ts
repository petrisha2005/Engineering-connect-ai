import { create } from "zustand";
import { getMyProfile, saveMyProfile } from "../services/profileApi";
import type { ProfilePayload, StudentProfile } from "../types/profile";

interface ProfileState {
  profile: StudentProfile | null;
  status: "idle" | "loading" | "ready" | "missing" | "error";
  error: string | null;
  loadMyProfile: () => Promise<void>;
  saveProfile: (payload: ProfilePayload) => Promise<StudentProfile>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  status: "idle",
  error: null,

  loadMyProfile: async () => {
    set({ status: "loading", error: null });
    try {
      const { profile } = await getMyProfile();
      set({ profile, status: "ready" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load profile";
      set({
        profile: null,
        status: message.includes("not been created") ? "missing" : "error",
        error: message
      });
    }
  },

  saveProfile: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const { profile } = await saveMyProfile(payload);
      set({ profile, status: "ready" });
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save profile";
      set({ status: "error", error: message });
      throw error;
    }
  }
}));
