import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: requiredString(2000),
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export type MessageDocument = InferSchemaType<typeof messageSchema>;
export const Message = model("Message", messageSchema);
