export type ResearchDomain =
  | "Artificial Intelligence"
  | "Machine Learning"
  | "Data Science"
  | "Cybersecurity"
  | "Blockchain"
  | "IoT"
  | "Robotics"
  | "Cloud Computing"
  | "Computer Vision"
  | "NLP"
  | "Software Engineering"
  | "Sustainable Technology";

export interface ResearchProfile {
  _id: string;
  researchDomains: ResearchDomain[];
  interests: string[];
  publications: Array<{ title: string; venue?: string; year?: number; url?: string }>;
  researchExperience: "beginner" | "intermediate" | "advanced" | "published";
  preferredTopics: string[];
  researchGoals: string[];
  preferredCollaborationMode: "remote" | "in_person" | "hybrid";
  availability: "low" | "medium" | "high";
  skills: string[];
  bio?: string;
  user?: { _id: string; displayName?: string; email?: string };
}

export interface ResearchProject {
  _id: string;
  title: string;
  abstract: string;
  domain: ResearchDomain;
  problemStatement: string;
  objectives: string[];
  requiredSkills: string[];
  teamSize: number;
  duration: string;
  publicationGoal: string;
  status: "Open" | "Recruiting" | "Active" | "Publishing" | "Completed";
  publicationStages: Array<{ stage: string; progress: number; status: string }>;
  owner?: { displayName?: string; email?: string };
}

export interface ResearchFacultyMentor {
  _id: string;
  name: string;
  department: string;
  expertise: string;
  researchAreas: string[];
  publications: string[];
  availability: "open" | "limited" | "unavailable";
  contactInformation?: string;
}

export interface ResearchReadiness {
  researchSkillScore: number;
  publicationReadiness: number;
  collaborationReadiness: number;
  innovationScore: number;
  overall: number;
}

export interface ResearchMatch {
  profile: ResearchProfile;
  matchScore: number;
  compatibilityReason: string;
  suggestedRole: string;
  collaborationPotential: string;
}

export interface ResearchProjectAnalysis {
  project: ResearchProject;
  missingSkills: string[];
  missingRoles: string[];
  recommendedStudents: ResearchMatch[];
  potentialMentors: ResearchFacultyMentor[];
}

export interface ResearchHubResponse {
  success: boolean;
  researchProfile: ResearchProfile | null;
  projects: ResearchProject[];
  myProjects: ResearchProject[];
  mentors: ResearchFacultyMentor[];
  opportunities: Array<{ _id: string; title: string; provider: string; type: string }>;
  readiness: ResearchReadiness;
  collaboratorMatches: ResearchMatch[];
  projectAnalyses: ResearchProjectAnalysis[];
  requests: Array<{ _id: string; type: string; status: string }>;
}
