import { NextRequest, NextResponse } from "next/server";

/**
 * Verify Gemini API key by making a simple models list request
 */
export async function POST(request: NextRequest) {
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
