import { Schema, model, type InferSchemaType } from "mongoose";
import { optionalUrl, requiredString } from "./schemaUtils.js";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "project_application",
        "project_invite",
        "application_decision",
        "team_application",
        "team_invite",
        "team_invite_accepted",
        "team_invite_rejected",
        "team_suggestion",
        "roadmap_generated",
        "connection_request",
        "connection_accepted",
        "mentor_request",
        "mentor_request_accepted",
        "skill_exchange_request",
        "skill_exchange_accepted",
        "skill_exchange_rejected",
        "skill_exchange_completed",
        "founder_request",
        "founder_request_accepted",
        "founder_request_rejected",
        "message",
        "system"
      ]
    },
    title: requiredString(140),
    body: requiredString(800),
    link: optionalUrl(),
    readAt: { type: Date, default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal", index: true }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });
notificationSchema.index({ user: 1, priority: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification = model("Notification", notificationSchema);
