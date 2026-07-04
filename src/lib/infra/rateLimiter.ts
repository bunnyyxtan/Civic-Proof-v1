// src/lib/infra/rateLimiter.ts

const memoryLimiter: Record<string, { count: number; expiresAt: number }> = {};

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  resetTime: string;
}

/**
 * Checks if a request is within the permitted limits.
 * Enforces in-memory limits.
 */
export async function checkRateLimit(
  userId: string,
  bucket: string,
  limit: number,
  windowHours: number = 1
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowHours * 60 * 60 * 1000;
  const resetTime = new Date(Math.ceil(now / windowMs) * windowMs).toISOString();
  
  const cacheKey = `${userId}:${bucket}:${Math.ceil(now / windowMs)}`;

  // Memory Limiter
  const entry = memoryLimiter[cacheKey];
  if (!entry || now > entry.expiresAt) {
    memoryLimiter[cacheKey] = {
      count: 1,
      expiresAt: now + windowMs,
    };
    return {
      allowed: true,
      count: 1,
      limit,
      remaining: limit - 1,
      resetTime,
    };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    count: entry.count,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetTime,
  };
}

export async function applyApiRateLimit(
  req: any,
  limit: number = 20,
  windowHours: number = 1
): Promise<{ ok: false; error: any; status: number } | null> {
  let citizenUid = "anonymous";
  
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    citizenUid = authHeader.substring(7, 39); // Take first 32 chars of token as ID
  }
  
  if (citizenUid === "anonymous") {
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    citizenUid = `ip_${ip}`;
  }

  const limitCheck = await checkRateLimit(citizenUid, "ai_routes", limit, windowHours);
  
  if (!limitCheck.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again shortly."
      },
      status: 429
    };
  }
  return null;
}
