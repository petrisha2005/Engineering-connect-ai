import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const feedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["Bug", "Suggestion", "UI Issue", "Feature Request", "Other"],
      required: true,
      index: true
    },
    message: requiredString(2000),
    rating: { type: Number, min: 1, max: 5, default: null }
  },
  { timestamps: true }
);

feedbackSchema.index({ userId: 1, createdAt: -1 });

export type FeedbackDocument = InferSchemaType<typeof feedbackSchema>;
export const Feedback = model("Feedback", feedbackSchema);
