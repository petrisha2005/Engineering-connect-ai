import { Schema, model, type InferSchemaType } from "mongoose";

const blockSchema = new Schema(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    blockedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

blockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

blockSchema.pre("validate", function validateBlock(next) {
  const block = this as any;
  if (block.blockerId?.equals(block.blockedUserId)) {
    block.invalidate("blockedUserId", "Users cannot block themselves");
  }
  next();
});

export type BlockDocument = InferSchemaType<typeof blockSchema>;
export const Block = model("Block", blockSchema);
