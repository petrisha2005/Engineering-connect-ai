import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const portfolioThemeSchema = new Schema(
  {
    key: { type: String, trim: true, lowercase: true, required: true, unique: true, index: true },
    name: requiredString(120),
    description: requiredString(500),
    accentColor: { type: String, trim: true, default: "#10b981" },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export type PortfolioThemeDocument = InferSchemaType<typeof portfolioThemeSchema>;
export const PortfolioTheme = model("PortfolioTheme", portfolioThemeSchema);
