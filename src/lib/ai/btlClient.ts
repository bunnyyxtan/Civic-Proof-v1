// src/lib/ai/btlClient.ts
// Server-safe Lazy BTL (OpenAI-compatible) client initializer

import OpenAI from "openai";

let aiInstance: OpenAI | null = null;

export function getBTLClient(): OpenAI {
  if (aiInstance) {
    return aiInstance;
  }

  const apiKey = process.env.GATEWAY_API_KEY;
  const baseURL = process.env.BTL_BASE_URL;
  
  if (!apiKey) {
    throw new Error("GATEWAY_API_KEY environment variable is required to initialize BTL Gateway.");
  }
  
  if (!baseURL) {
    throw new Error("BTL_BASE_URL environment variable is required to initialize BTL Gateway.");
  }

  aiInstance = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  return aiInstance;
}
