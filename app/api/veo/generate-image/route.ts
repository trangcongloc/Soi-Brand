import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

interface GenerateImageRequest {
  characterDescription: string;
  characterName: string;
  model: string;
  apiKey: string;
}

function buildCharacterImagePrompt(name: string, description: string): string {
  return [
    `Generate a full-body character illustration of "${name}".`,
    `Character details: ${description}`,
    "",
    "REQUIREMENTS:",
    "- Full body shot from head to feet",
    "- Plain white background, no scenery, no props, no other objects",
    "- Character standing in a neutral but natural pose",
    "- High quality, detailed illustration",
    "- Clean edges suitable for cutout/compositing",
    "- No text, no watermarks, no borders",
    "- Only the character, nothing else",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateImageRequest;
    const { characterDescription, characterName, model, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is required" },
        { status: 401 }
      );
    }

    if (!characterDescription || !characterName) {
      return NextResponse.json(
        { error: "Character name and description are required" },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: "Image model is required" },
        { status: 400 }
      );
    }

    const prompt = buildCharacterImagePrompt(characterName, characterDescription);

    const url = `${GEMINI_API_BASE}${model}:generateContent`;
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Gemini API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData?.error?.message || errorMessage;
      } catch {
        // use default message
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract image from response parts
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    let imageData: string | null = null;
    let mimeType = "image/png";
    let textResponse = "";

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
      }
      if (part.text) {
        textResponse = part.text;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "No image data in response", textResponse },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: imageData,
      mimeType,
      text: textResponse,
      characterName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
