// src/lib/api/responses.ts
// Standardized JSON response templates

import { NextResponse } from "next/server";

export function successResponse(data: Record<string, any>, status = 200) {
  return NextResponse.json(
    {
      success: true,
      timestamp: new Date().toISOString(),
      ...data,
    },
    { status }
  );
}
