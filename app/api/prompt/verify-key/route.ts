import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";

// Strict rate limit: 3 requests per minute per IP to prevent brute-force attacks
const VERIFY_KEY_RATE_LIMIT = { limit: 3, windowMs: 60000 };

/**
 * Verify Gemini API key by making a simple models list request
 * Rate-limited to 3 requests per minute per IP to prevent brute-force attacks
 */
export async function POST(request: NextRequest) {
  // Rate limiting check - strict limit to prevent key brute-forcing
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`verify-key:${clientId}`, VERIFY_KEY_RATE_LIMIT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        valid: false,
        error: "Rate limit exceeded. Please wait before trying again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(VERIFY_KEY_RATE_LIMIT.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
        },
      }
    );
  }

  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: "No API key provided" });
    }

    // Make a simple request to list models - this validates the key
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: "GET" }
    );

    if (response.ok) {
      const data = await response.json();
      // Extract available model names
      const models = data.models?.map((m: { name: string }) => m.name.replace("models/", "")) || [];
      return NextResponse.json({
        valid: true,
        models: models.filter((m: string) => m.includes("gemini"))
      });
    } else {
      const error = await response.json();
      return NextResponse.json({
        valid: false,
        error: error.error?.message || "Invalid API key"
      });
    }
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : "Verification failed"
    });
  }
}
