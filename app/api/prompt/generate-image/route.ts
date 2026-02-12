import { NextRequest, NextResponse } from "next/server";

import {
  GEMINI_API_BASE_URL,
  DEFAULT_CHARACTER_IMAGE_ASPECT_RATIO,
  THINKING_BUDGET_IMAGE_GEN,
} from "@/lib/prompt/constants";

interface GenerateImageRequest {
  characterDescription: string;
  characterName: string;
  model: string;
  apiKey: string;
  aspectRatio?: string;
}

function buildCharacterImagePrompt(name: string, description: string): string {
  return [
    `Photorealistic photograph of a real person: "${name}".`,
    `Person details: ${description}`,
    "",
    "REQUIREMENTS:",
    "- Photorealistic, real human being — NOT cartoon, NOT illustration, NOT 2D, NOT 3D render, NOT anime, NOT animated",
    "- Studio photography style, shot with a professional DSLR camera (85mm f/1.8 lens)",
    "- Full body shot from head to feet, natural standing pose with slight weight shift for realism",
    "- Plain white studio background, no scenery, no props, no other objects",
    "",
    "SKIN & LIGHTING:",
    "- Realistic skin texture with visible pores, subtle subsurface scattering",
    "- Three-point studio lighting: soft key light at 45 degrees, fill light opposite, rim light for edge separation",
    "- Natural skin tones with warm undertones, soft diffused shadows under chin and along jawline",
    "- Catch lights visible in eyes for lifelike appearance",
    "",
    "CLOTHING & FABRIC:",
    "- Fabric texture clearly visible: weave patterns, stitching, material weight",
    "- Natural fabric drape and folds responding to body position and gravity",
    "- Accurate material rendering: cotton breathability, silk sheen, denim texture, leather grain",
    "",
    "FINAL:",
    "- Clean edges suitable for cutout/compositing",
    "- No text, no watermarks, no borders",
    "- Only the person, nothing else",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateImageRequest;
    const { characterDescription, characterName, model, apiKey, aspectRatio } = body;

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

    const isProModel = model.includes("pro");
    const effectiveAspectRatio = aspectRatio || DEFAULT_CHARACTER_IMAGE_ASPECT_RATIO;

    const url = `${GEMINI_API_BASE_URL}${model}:generateContent`;
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        aspectRatio: effectiveAspectRatio,
        ...(isProModel && {
          thinkingConfig: { thinkingBudget: THINKING_BUDGET_IMAGE_GEN },
        }),
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
