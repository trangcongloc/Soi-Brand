/**
 * Prompt Pipeline - Phase 1: Character extraction prompts
 */

import {
  GeminiRequestBody,
  CharacterSkeleton,
  CharacterExtractionResult,
} from "../types";
import { extractJsonFromText } from "./shared";

/**
 * System instruction for character extraction (Phase 1)
 */
const CHARACTER_EXTRACTION_SYSTEM = `ROLE: You are an expert character analyst for video production.

<goal>
Watch the ENTIRE video and identify ALL distinct characters/people visible.
This extraction happens BEFORE scene generation to ensure consistent naming throughout.
Output: JSON object with "characters" array and "background" string.
</goal>

<identification-rules priority="critical">
- Identify EVERY distinct person who appears in the video
- Assign consistent, specific names (NOT generic like "Chef" then "Chef Marco" - pick ONE name)
- For named characters (if name is mentioned/shown): use that exact name
- For unnamed characters: assign descriptive names based on role: "The Host", "Guest Sarah", "Narrator Mike"
- Include timestamps of first appearance for each character
- Track ALL physical attributes that remain constant throughout
</identification-rules>

<character-attributes>
For each character, include:
- name: Consistent identifier (e.g., "Chef Marco", "Host Alex", "The Narrator")
- gender: male/female/non-binary
- age: estimated range (e.g., "40s", "mid-30s", "early 20s")
- ethnicity: skin tone and cultural appearance if visible
- bodyType: height and build description
- faceShape: face shape description
- hair: color, length, style, texture
- facialHair: beard, mustache, stubble, or clean-shaven (for males)
- distinctiveFeatures: scars, tattoos, birthmarks, glasses, piercings
- baseOutfit: primary/default clothing worn
- firstAppearance: timestamp when character first appears (e.g., "0:15")
</character-attributes>

<background-description>
Describe the main environment/setting where most action takes place.
Include: location type, key elements, lighting mood, color palette.
Example: "rustic farmhouse kitchen, copper pots on wall, wooden beams, warm morning sunlight"
</background-description>

<edge-cases>
- If NO visible characters (only objects, text, graphics): return empty characters array
- If characters are only partially visible: describe what IS visible
- If multiple outfits: describe the FIRST/primary outfit in baseOutfit
</edge-cases>

<strictness>
- Return ONLY valid JSON according to the schema
- Do NOT include camera terms in character descriptions
- Use objective, visual facts only
</strictness>

<self-critique>
Before finalizing JSON output, verify:
1. COMPLETENESS: every person visible in the video is listed
2. NAMING: each character has exactly ONE consistent name (no duplicates, no generic-then-specific)
3. ATTRIBUTES: every character has at least name, gender, and baseOutfit filled
4. BACKGROUND: the background field describes the primary setting
5. JSON VALIDITY: output matches the required schema exactly
If ANY check fails, fix before outputting.
</self-critique>`;

/**
 * User prompt for character extraction
 */
const CHARACTER_EXTRACTION_USER = `Watch this entire video and identify ALL distinct characters/people.

REQUIREMENTS:
1. List every person who appears on screen
2. Assign each character a SINGLE consistent name
3. Provide detailed physical descriptions that remain constant
4. Note the timestamp when each character first appears
5. Describe the main background/environment setting

Return ONLY valid JSON according to the schema.`;

/**
 * Response schema for character extraction
 */
const CHARACTER_EXTRACTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    characters: {
      type: "ARRAY",
      description: "All distinct characters identified in the video",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Consistent character name (e.g., 'Chef Marco', 'Host Alex')" },
          gender: { type: "STRING", description: "male/female/non-binary" },
          age: { type: "STRING", description: "Estimated age range (e.g., '40s', 'mid-30s')" },
          ethnicity: { type: "STRING", description: "Skin tone and cultural appearance" },
          bodyType: { type: "STRING", description: "Height and build (e.g., 'tall, stocky build')" },
          faceShape: { type: "STRING", description: "Face shape (e.g., 'square jaw', 'oval face')" },
          hair: { type: "STRING", description: "Hair color, length, style, texture" },
          facialHair: { type: "STRING", description: "Beard, mustache, stubble, or clean-shaven" },
          distinctiveFeatures: { type: "STRING", description: "Scars, tattoos, glasses, piercings, etc." },
          baseOutfit: { type: "STRING", description: "Primary clothing worn" },
          firstAppearance: { type: "STRING", description: "Timestamp of first appearance (e.g., '0:15')" },
        },
        required: ["name", "gender", "baseOutfit"],
      },
    },
    background: {
      type: "STRING",
      description: "Main environment/setting description (location, elements, lighting, colors)",
    },
  },
  required: ["characters", "background"],
};

/**
 * Build character extraction request for Phase 1
 * This extracts all characters BEFORE scene generation
 */
export function buildCharacterExtractionPrompt(options: {
  videoUrl: string;
  startTime?: string;
  endTime?: string;
}): GeminiRequestBody {
  let userPrompt = CHARACTER_EXTRACTION_USER;

  // Add time range instruction if provided
  if (options.startTime || options.endTime) {
    const timeRange = [];
    if (options.startTime) {
      timeRange.push(`from ${options.startTime}`);
    }
    if (options.endTime) {
      timeRange.push(`to ${options.endTime}`);
    }
    userPrompt += `\n\nTIME RANGE: Only analyze the video segment ${timeRange.join(" ")}.`;
  }

  return {
    contents: [
      {
        parts: [
          {
            fileData: {
              fileUri: options.videoUrl,
              mimeType: "video/mp4",
            },
          },
          {
            text: userPrompt,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: CHARACTER_EXTRACTION_SYSTEM }],
    },
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: CHARACTER_EXTRACTION_SCHEMA,
    },
  };
}

/**
 * Parse character extraction response from Gemini API
 */
export function parseCharacterExtractionResponse(response: {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
}): CharacterExtractionResult {
  const candidate = response?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No text response from Gemini API for character extraction");
  }

  try {
    const parsed = JSON.parse(text);
    return normalizeCharacterExtraction(parsed);
  } catch {
    // Try extracting JSON from formatted text
  }

  // Try extracting JSON from markdown/formatted response
  const extracted = extractJsonFromText(text);
  try {
    const parsed = JSON.parse(extracted);
    return normalizeCharacterExtraction(parsed);
  } catch (parseError) {
    const preview = text.substring(0, 300);
    const errorMsg = parseError instanceof Error ? parseError.message : "Unknown parse error";
    throw new Error(
      `Failed to parse character extraction response as JSON. Error: ${errorMsg}. Response preview: ${preview}${text.length > 300 ? "..." : ""}`
    );
  }
}

/**
 * Normalize character extraction result
 */
function normalizeCharacterExtraction(parsed: Record<string, unknown>): CharacterExtractionResult {
  const characters: CharacterSkeleton[] = [];

  if (Array.isArray(parsed.characters)) {
    for (const char of parsed.characters) {
      if (typeof char === "object" && char !== null) {
        const charObj = char as Record<string, unknown>;
        // Skip "no visible characters" type entries
        const name = String(charObj.name || "").trim();
        if (
          name &&
          !name.toLowerCase().includes("no visible") &&
          !name.toLowerCase().includes("none") &&
          name.toLowerCase() !== "n/a"
        ) {
          characters.push({
            name,
            gender: String(charObj.gender || ""),
            age: String(charObj.age || ""),
            ethnicity: String(charObj.ethnicity || ""),
            bodyType: String(charObj.bodyType || ""),
            faceShape: String(charObj.faceShape || ""),
            hair: String(charObj.hair || ""),
            facialHair: charObj.facialHair ? String(charObj.facialHair) : undefined,
            distinctiveFeatures: charObj.distinctiveFeatures ? String(charObj.distinctiveFeatures) : undefined,
            baseOutfit: String(charObj.baseOutfit || ""),
            firstAppearance: charObj.firstAppearance ? String(charObj.firstAppearance) : undefined,
          });
        }
      }
    }
  }

  return {
    characters,
    background: String(parsed.background || ""),
  };
}
