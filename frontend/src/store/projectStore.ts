import { create } from "zustand";
import { createProject, listProjects } from "../services/projectApi";
import type { Project, ProjectPayload } from "../types/project";

interface ProjectState {
  projects: Project[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  loadProjects: (params?: Record<string, string | number | undefined>) => Promise<void>;
  createNewProject: (payload: ProjectPayload) => Promise<Project>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  status: "idle",
  error: null,

  loadProjects: async (params = {}) => {
    set({ status: "loading", error: null });
    try {
      const { projects } = await listProjects(params);
      set({ projects, status: "ready" });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Unable to load projects" });
    }
  },

  createNewProject: async (payload) => {
    set({ status: "loading", error: null });
    const { project } = await createProject(payload);
    set((state) => ({ projects: [project, ...state.projects], status: "ready" }));
    return project;
  }
}));

