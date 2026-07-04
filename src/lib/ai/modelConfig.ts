// src/lib/ai/modelConfig.ts
// AI Gateway Configuration and Feature Flag Manager

export function getGatewayApiKey(): string | undefined {
  return process.env.GATEWAY_API_KEY;
}



export function shouldUseAI(): boolean {
  const key = getGatewayApiKey();
  return typeof key === "string" && key.trim().length > 0;
}



export function getTextModelName(): string {
  return process.env.BTL_TEXT_MODEL || "deepseek-v4-flash";
}

export function getMultimodalModelName(): string {
  return process.env.BTL_VISION_MODEL || "gpt-4o-mini";
}

