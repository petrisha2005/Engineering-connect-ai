import { Schema, model, type InferSchemaType } from "mongoose";
import { requiredString } from "./schemaUtils.js";

const pitchSlideSchema = new Schema(
  {
    title: requiredString(120),
    content: requiredString(1600),
    speakerNotes: { type: String, trim: true, maxlength: 1600, default: "" }
  },
  { _id: false }
);

const pitchDeckSchema = new Schema(
  {
    startup: { type: Schema.Types.ObjectId, ref: "StartupProfile", required: true, unique: true, index: true },
    slides: { type: [pitchSlideSchema], default: [] },
    exportText: { type: String, trim: true, maxlength: 10000, default: "" },
    model: { type: String, trim: true, default: "gemini" },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export type PitchDeckDocument = InferSchemaType<typeof pitchDeckSchema>;
export const PitchDeck = model("PitchDeck", pitchDeckSchema);
