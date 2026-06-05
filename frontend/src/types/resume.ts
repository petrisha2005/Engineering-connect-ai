export interface ResumeSuggestedProject {
  title: string;
  description: string;
  skills: string[];
}

export interface ResumeCareerRoleFit {
  role: string;
  fitScore: number;
  reason: string;
}

export interface ResumeReport {
  _id: string;
  user: string;
  fileName: string;
  atsScore: number;
  strengths: string[];
  weakSections: string[];
  missingSkills: string[];
  missingKeywords: string[];
  suggestedProjects: ResumeSuggestedProject[];
  careerRoleFit: ResumeCareerRoleFit[];
  improvementTips: string[];
  resumeTextPreview?: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}
