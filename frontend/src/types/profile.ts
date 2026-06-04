export type Availability = "open" | "selective" | "unavailable";

export interface ProfileProject {
  title: string;
  description: string;
  links: string[];
  skills: string[];
}

export interface ProfileUser {
  _id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface StudentProfile {
  _id: string;
  user: string | ProfileUser;
  name: string;
  college: string;
  branch: string;
  year: number;
  skills: string[];
  interests: string[];
  goals: string[];
  projects: ProfileProject[];
  github: string;
  linkedin: string;
  achievements: string[];
  availability: Availability;
  headline?: string;
  bio?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePayload {
  name: string;
  college: string;
  branch: string;
  year: number;
  skills: string[];
  interests: string[];
  goals: string[];
  projects: ProfileProject[];
  github: string;
  linkedin: string;
  achievements: string[];
  availability: Availability;
  headline?: string;
  bio?: string;
  location?: string;
}

export interface ProfileListResponse {
  profiles: StudentProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
