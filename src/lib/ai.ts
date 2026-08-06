import { GoogleGenAI } from "@google/genai";

// GOOGLE_AI is the name used in this project's Vercel settings; the others are
// common alternatives, accepted so a differently-named key still works.
export const AI_KEY_VARS = [
  "GOOGLE_AI",
  "GOOGLE_AI_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
] as const;

export function getAiKey() {
  for (const name of AI_KEY_VARS) {
    const value = process.env[name];
    if (value) return { name, value };
  }
  return null;
}

export function getAiClient() {
  const found = getAiKey();
  if (!found) throw new Error(`No Gemini API key set. Expected one of: ${AI_KEY_VARS.join(", ")}`);
  return new GoogleGenAI({ apiKey: found.value });
}

export const GEMINI_MODEL = "gemini-2.5-flash";
