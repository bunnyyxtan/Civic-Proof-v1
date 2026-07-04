// src/lib/ai/aiJson.ts
// Robust JSON extractor for LLM output

export function extractJson(text: string): Record<string, any> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Empty text content cannot be parsed as JSON.");
  }

  // 1. Try direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch (_) {}

  // 2. Look for ```json ... ``` or ``` ... ``` block
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(jsonBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (_) {}
  }

  // 3. Fallback: Find the first '{' and last '}'
  const startIdx = trimmed.indexOf("{");
  const endIdx = trimmed.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const candidate = trimmed.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {}
  }

  // 4. Last resort: Truncated JSON repair
  if (startIdx !== -1) {
    const fromStart = trimmed.substring(startIdx);
    const lastCommaIdx = fromStart.lastIndexOf(",");
    if (lastCommaIdx !== -1) {
      // Try closing as an array item cutoff
      const repairedArray = fromStart.substring(0, lastCommaIdx) + "]}";
      try {
        const parsed = JSON.parse(repairedArray);
        console.log("[extractJson] repaired truncated JSON");
        return parsed;
      } catch (_) {}

      // Try closing as an object property cutoff
      const repairedObj = fromStart.substring(0, lastCommaIdx) + "}";
      try {
        const parsed = JSON.parse(repairedObj);
        console.log("[extractJson] repaired truncated JSON");
        return parsed;
      } catch (_) {}
    }
  }

  throw new Error("Unable to locate any valid JSON structure in the text response.");
}
