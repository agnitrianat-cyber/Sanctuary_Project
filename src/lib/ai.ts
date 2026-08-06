import { GoogleGenAI } from "@google/genai";

export function getAiClient() {
  const apiKey = process.env.GOOGLE_AI;
  if (!apiKey) throw new Error("GOOGLE_AI is not set");
  return new GoogleGenAI({ apiKey });
}

export const GEMINI_MODEL = "gemini-2.5-flash";
