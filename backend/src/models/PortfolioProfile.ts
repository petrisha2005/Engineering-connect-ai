import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalUrl, requiredString, stringList } from "./schemaUtils.js";

export const portfolioTypes = ["Student Portfolio", "Job Portfolio", "Startup Founder Portfolio", "Research Portfolio", "Freelancer Portfolio"] as const;
export const portfolioThemes = ["Modern Developer", "AI Engineer", "Data Scientist", "Startup Founder", "Researcher"] as const;

const portfolioProjectSchema = new Schema(
  {
    title: requiredString(180),
    description: requiredString(1400),
    skills: stringList(30, 100),
    impactScore: { type: Number, min: 0, max: 100, default: 0 },
    links: stringList(8, 240)
  },
  { _id: false }
);

const portfolioSectionsSchema = new Schema(
  {
    heroTitle: requiredString(180),
    heroSubtitle: requiredString(500),
    professionalSummary: requiredString(1800),
    aboutMe: requiredString(1800),
    recruiterSummary: requiredString(1200),
    skills: stringList(80, 120),
    projects: { type: [portfolioProjectSchema], default: [] },
    certifications: stringList(40, 200),
    achievements: stringList(50, 220),
    hackathons: stringList(40, 220),
    research: stringList(40, 260),
    experience: stringList(40, 260),
    careerGoals: stringList(30, 180),
    contact: {
      email: { type: String, trim: true, maxlength: 254, default: "" },
      github: optionalUrl(),
      linkedin: optionalUrl()
    }
  },
  { _id: false }
);

const portfolioImprovementSchema = new Schema(
  {
    missingSections: stringList(20, 160),
    betterProjectDescriptions: stringList(20, 260),
    missingSkills: stringList(40, 120),
    missingCertifications: stringList(30, 180),
    portfolioImprovements: stringList(30, 240)
  },
  { _id: false }
);

const portfolioProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    username: { type: String, trim: true, lowercase: true, required: true, unique: true, index: true },
    publicPath: { type: String, trim: true, required: true, unique: true },
    type: { type: String, enum: portfolioTypes, default: "Student Portfolio", index: true },
    theme: { type: String, enum: portfolioThemes, default: "Modern Developer", index: true },
    published: { type: Boolean, default: true, index: true },
    sections: { type: portfolioSectionsSchema, required: true },
    improvementEngine: { type: portfolioImprovementSchema, default: () => ({}) },
    recruiterMode: {
      technicalScore: { type: Number, min: 0, max: 100, default: 0 },
      innovationScore: { type: Number, min: 0, max: 100, default: 0 },
      leadershipScore: { type: Number, min: 0, max: 100, default: 0 },
      careerReadiness: { type: Number, min: 0, max: 100, default: 0 },
      overallScore: { type: Number, min: 0, max: 100, default: 0 }
    },
    sourceSummary: {
      skillsCount: { type: Number, default: 0 },
      projectsCount: { type: Number, default: 0 },
      hackathonsCount: { type: Number, default: 0 },
      achievementsCount: { type: Number, default: 0 },
      lastGeneratedAt: { type: Date, default: Date.now }
    },
    model: { type: String, trim: true, default: "gemini" }
  },
  { timestamps: true }
);

portfolioProfileSchema.index({ username: "text", "sections.heroTitle": "text", "sections.skills": "text", "sections.projects.title": "text" });

export type PortfolioProfileDocument = InferSchemaType<typeof portfolioProfileSchema>;
export const PortfolioProfile = model("PortfolioProfile", portfolioProfileSchema);
