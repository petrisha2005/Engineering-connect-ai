import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

const phaseSchema = new Schema(
  {
    phaseNumber: { type: Number, min: 1, max: 12 },
    title: requiredString(140),
    duration: requiredString(80),
    goal: { type: String, trim: true, maxlength: 800 },
    skills: stringList(30, 100),
    tools: stringList(30, 100),
    weeklyPlan: {
      type: [
        new Schema(
          {
            week: { type: Number, min: 1, max: 26, required: true },
            tasks: stringList(12, 240)
          },
          { _id: false }
        )
      ],
      default: []
    },
    miniProjects: stringList(20, 240),
    projects: {
      type: [requiredString(240)],
      default: [],
      validate: {
        validator: (items: string[]) => items.length <= 30,
        message: "A phase can contain at most 30 projects"
      }
    },
    resourcesToSearch: stringList(20, 240),
    resources: {
      type: [requiredString(240)],
      default: [],
      validate: {
        validator: (items: string[]) => items.length <= 12,
        message: "A phase can contain at most 12 resources"
      }
    },
    milestoneChecklist: stringList(20, 240)
  },
  { _id: false }
);

const recommendedProjectSchema = new Schema(
  {
    title: requiredString(160),
    description: requiredString(1200),
    skills: stringList(30, 100)
  },
  { _id: false }
);

const portfolioProjectSchema = new Schema(
  {
    title: requiredString(180),
    description: requiredString(1200),
    features: stringList(20, 200),
    skillsUsed: stringList(30, 100),
    difficulty: { type: String, trim: true, maxlength: 80 },
    resumeValue: { type: String, trim: true, maxlength: 80 }
  },
  { _id: false }
);

const certificationSchema = new Schema(
  {
    name: requiredString(180),
    whyUseful: { type: String, trim: true, maxlength: 800 }
  },
  { _id: false }
);

const interviewPreparationSchema = new Schema(
  {
    technicalTopics: stringList(30, 200),
    codingTopics: stringList(30, 200),
    systemDesignBasics: stringList(30, 200),
    hrQuestions: stringList(30, 240)
  },
  { _id: false }
);

const finalPlanSchema = new Schema(
  {
    dayRange: requiredString(80),
    focus: requiredString(240),
    actions: stringList(12, 240)
  },
  { _id: false }
);

const roadmapSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    careerGoal: { ...requiredString(160), index: true },
    desiredCareer: { ...requiredString(160), index: true },
    overview: requiredString(1600),
    duration: requiredString(80),
    difficulty: { type: String, trim: true, maxlength: 80, default: "Beginner to Intermediate" },
    requiredMindset: stringList(20, 160),
    phases: {
      type: [phaseSchema],
      default: [],
      validate: {
        validator: (items: unknown[]) => items.length <= 12,
        message: "A roadmap can contain at most 12 phases"
      }
    },
    recommendedProjects: {
      type: [recommendedProjectSchema],
      default: [],
      validate: {
        validator: (items: unknown[]) => items.length <= 20,
        message: "A roadmap can contain at most 20 recommended projects"
      }
    },
    portfolioProjects: {
      type: [portfolioProjectSchema],
      default: [],
      validate: {
        validator: (items: unknown[]) => items.length <= 12,
        message: "A roadmap can contain at most 12 portfolio projects"
      }
    },
    skills: stringList(80, 100),
    projects: {
      type: [requiredString(240)],
      default: [],
      validate: {
        validator: (items: string[]) => items.length <= 30,
        message: "A roadmap can contain at most 30 projects"
      }
    },
    certifications: { type: [certificationSchema], default: [] },
    interviewPreparation: { type: interviewPreparationSchema, default: () => ({}) },
    commonMistakes: stringList(30, 240),
    final30DayPlan: { type: [finalPlanSchema], default: [] },
    nextSteps: {
      type: [requiredString(240)],
      default: [],
      validate: {
        validator: (items: string[]) => items.length <= 20,
        message: "A roadmap can contain at most 20 next steps"
      }
    },
    rawAiResponse: requiredString(100000),
    model: { type: String, required: true, trim: true, default: "gemini" }
  },
  { timestamps: true }
);

roadmapSchema.index({ user: 1, createdAt: -1 });
roadmapSchema.index({ careerGoal: "text", desiredCareer: "text", skills: "text", projects: "text", certifications: "text" });

roadmapSchema.pre("validate", function normalizeRoadmapArrays(next) {
  const roadmap = this as any;
  roadmap.userId = roadmap.userId ?? roadmap.user;
  roadmap.careerGoal = roadmap.careerGoal ?? roadmap.desiredCareer;
  roadmap.desiredCareer = roadmap.desiredCareer ?? roadmap.careerGoal;
  roadmap.skills = uniqueLowercase(roadmap.skills);
  next();
});

export type RoadmapDocument = InferSchemaType<typeof roadmapSchema>;
export const Roadmap = model("Roadmap", roadmapSchema);
