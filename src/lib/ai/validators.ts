// src/lib/ai/validators.ts
// Zod Validators for robust input/output parsing

import { z } from "zod";

export function validateInput<T>(schema: z.Schema<T>, data: unknown): { success: true; data: T } | { success: false; error: string; details: any } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      error: "Validation error occurred.",
      details: result.error.format(),
    };
  }
}
