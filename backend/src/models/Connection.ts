import { Schema, model, type InferSchemaType } from "mongoose";

const connectionSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true }
  },
  { timestamps: true }
);

connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
connectionSchema.index({ recipientId: 1, status: 1, createdAt: -1 });

connectionSchema.pre("validate", function validateConnection(next) {
  const connection = this as any;
  if (connection.requesterId?.equals(connection.recipientId)) {
    connection.invalidate("recipientId", "Users cannot connect with themselves");
  }
  next();
});

export type ConnectionDocument = InferSchemaType<typeof connectionSchema>;
export const Connection = model("Connection", connectionSchema);
