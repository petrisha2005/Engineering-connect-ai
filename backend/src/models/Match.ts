import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString, stringList, uniqueLowercase } from "./schemaUtils.js";

const matchSchema = new Schema(
  {
    sourceUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    matchScore: { type: Number, required: true, min: 0, max: 100, index: true },
    compatibilityScore: { type: Number, required: true, min: 0, max: 100 },
    reasons: {
      type: [requiredString(240)],
      required: true,
      validate: {
        validator: (items: string[]) => items.length > 0 && items.length <= 10,
        message: "A match must include 1 to 10 reasons"
      }
    },
    sharedSkills: stringList(50, 80),
    sharedInterests: stringList(50, 80),
    sharedGoals: stringList(30, 120),
    generatedBy: { type: String, enum: ["algorithm", "ai"], default: "algorithm" }
  },
  { timestamps: true }
);

matchSchema.index({ sourceUser: 1, targetUser: 1 }, { unique: true });
matchSchema.index({ sourceUser: 1, matchScore: -1 });
matchSchema.index({ targetUser: 1, matchScore: -1 });

matchSchema.pre("validate", function validateAndNormalizeMatch(next) {
  const match = this as any;
  if (match.sourceUser?.equals(match.targetUser)) {
    match.invalidate("targetUser", "A user cannot be matched with themselves");
  }

  match.sharedSkills = uniqueLowercase(match.sharedSkills);
  match.sharedInterests = uniqueLowercase(match.sharedInterests);
  match.sharedGoals = uniqueLowercase(match.sharedGoals);
  next();
});

export type MatchDocument = InferSchemaType<typeof matchSchema>;
export const Match = model("Match", matchSchema);
