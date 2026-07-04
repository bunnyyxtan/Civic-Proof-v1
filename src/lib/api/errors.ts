// src/lib/api/errors.ts
// Standardized JSON error templates and handler schemas

import { NextResponse } from "next/server";

export function errorResponse(message: string, code = "INTERNAL_SERVER_ERROR", status = 500, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
