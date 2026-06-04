import { Schema, model, type InferSchemaType } from "mongoose";
import { URL_REGEX } from "./schemaUtils.js";

const userSchema = new Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 128,
      unique: true,
      index: true,
      immutable: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 254,
      unique: true,
      lowercase: true,
      immutable: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Must be a valid email"]
    },
    displayName: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    photoURL: {
      type: String,
      trim: true,
      validate: {
        validator: (value?: string) => !value || URL_REGEX.test(value),
        message: "Must be a valid http or https URL"
      }
    },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    lastLoginAt: { type: Date },
    profile: { type: Schema.Types.ObjectId, ref: "Profile" }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
