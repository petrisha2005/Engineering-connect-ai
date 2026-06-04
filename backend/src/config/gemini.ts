import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env.js";

export const gemini = new GoogleGenerativeAI(env.GEMINI_API_KEY);

