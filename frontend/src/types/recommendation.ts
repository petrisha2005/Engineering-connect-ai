export interface SkillSuggestion {
  skill: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  source: "Career Goal" | "Career Roadmap" | "Project Marketplace";
}

export interface SkillsToImproveResponse {
  success: boolean;
  skillsToImprove: SkillSuggestion[];
}
