import { Schema, model, type InferSchemaType } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length === 2,
        message: "A direct conversation must contain exactly two participants"
      }
    },
    participantKey: { type: String, required: true, unique: true, index: true },
    lastMessage: { type: String, trim: true, maxlength: 1000, default: "" }
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

export type ConversationDocument = InferSchemaType<typeof conversationSchema>;
export const Conversation = model("Conversation", conversationSchema);
