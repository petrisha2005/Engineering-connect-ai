import { Schema, model, type InferSchemaType } from "mongoose";

const portfolioAnalyticsEventSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["portfolio_view", "recruiter_view", "profile_click", "resume_download", "project_click"],
      required: true,
      index: true
    },
    projectTitle: { type: String, trim: true, maxlength: 180, default: "" },
    occurredAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const portfolioAnalyticsSchema = new Schema(
  {
    portfolio: { type: Schema.Types.ObjectId, ref: "PortfolioProfile", required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    portfolioViews: { type: Number, min: 0, default: 0 },
    recruiterViews: { type: Number, min: 0, default: 0 },
    profileClicks: { type: Number, min: 0, default: 0 },
    resumeDownloads: { type: Number, min: 0, default: 0 },
    projectClicks: { type: Number, min: 0, default: 0 },
    events: { type: [portfolioAnalyticsEventSchema], default: [] }
  },
  { timestamps: true }
);

portfolioAnalyticsSchema.index({ user: 1, updatedAt: -1 });

export type PortfolioAnalyticsDocument = InferSchemaType<typeof portfolioAnalyticsSchema>;
export const PortfolioAnalytics = model("PortfolioAnalytics", portfolioAnalyticsSchema);
