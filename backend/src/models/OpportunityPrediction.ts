import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const opportunityItemSchema = new Schema(
  {
    type: requiredString(120),
    readiness: { type: Number, min: 0, max: 100, default: 0 },
    reason: { type: String, trim: true, maxlength: 800, default: "" },
    nextAction: { type: String, trim: true, maxlength: 240, default: "" }
  },
  { _id: false }
);

const opportunityPredictionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    careerTwin: { type: Schema.Types.ObjectId, ref: "CareerTwinProfile", required: true, index: true },
    predictions: { type: [opportunityItemSchema], default: [] }
  },
  { timestamps: true }
);

opportunityPredictionSchema.index({ user: 1, createdAt: -1 });

export type OpportunityPredictionDocument = InferSchemaType<typeof opportunityPredictionSchema>;
export const OpportunityPrediction = model("OpportunityPrediction", opportunityPredictionSchema);
