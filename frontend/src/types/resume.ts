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

export interface ImprovedResumeProject {
  title: string;
  description: string;
  bullets: string[];
}

export interface ImprovedResume {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: string[];
  projects: ImprovedResumeProject[];
  education: string[];
  certifications: string[];
  achievements: string[];
  experience: string[];
  atsTips: string[];
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
  formatIssues: string[];
  suggestedProjects: ResumeSuggestedProject[];
  careerRoleFit: ResumeCareerRoleFit[];
  roleFit: string;
  improvementTips: string[];
  improvedResume: ImprovedResume;
  resumeTextPreview?: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}
