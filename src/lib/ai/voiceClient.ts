// src/lib/ai/voiceClient.ts
// Server-safe Lazy Gemini client initializer

import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./modelConfig";

let aiInstance: GoogleGenAI | null = null;

export function getVoiceClient(): GoogleGenAI {
  if (aiInstance) {
    return aiInstance;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required to initialize Gemini.");
  }

  aiInstance = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'civicproof',
      },
    },
  });

  return aiInstance;
}
