/**
 * VEO Pipeline - Prompt templates for scene generation
 */

import { GeminiRequestBody, VoiceLanguage, AudioSettings, GeneratedScript, DirectBatchInfo, CharacterSkeleton, CharacterExtractionResult, CinematicProfile, ColorProfileExtractionResult, StyleObject, MediaType } from "./types";

// ============================================================================
// NEGATIVE PROMPT DEFAULTS
// ============================================================================

/**
 * Default negative prompt - common AI video generation issues
 * NOTE: This replaces the text overlay rule previously in BASE_USER_PROMPT (line 489)
 */
export const DEFAULT_NEGATIVE_PROMPT =
  // Text and overlays (moved from system instruction)
  "text overlays, subtitles, captions, watermarks, logos, UI overlays, " +
  // Quality issues
  "blurry, low quality, out of focus, compression artifacts, pixelated, " +
  // Anatomical/physics errors
  "duplicate subjects, anatomical errors, extra limbs, deformed faces, " +
  // Continuity issues
  "repeated actions, looping movements, objects appearing out of nowhere, " +
  "objects disappearing suddenly, teleporting items";

/**
 * Get preset negative prompt by mode
 */
export function getDefaultNegativePrompt(
  mode: "minimal" | "standard" | "aggressive" = "standard"
): string {
  if (mode === "minimal") {
    return "text overlays, watermarks, blurry, low quality";
  }
  if (mode === "aggressive") {
    return DEFAULT_NEGATIVE_PROMPT + ", motion blur, grain, noise, flickering, vignetting, black bars";
  }
  return DEFAULT_NEGATIVE_PROMPT; // standard
}

// ============================================================================
// PHASE 1: Character Extraction (BEFORE scene generation)
// ============================================================================

/**
 * System instruction for character extraction (Phase 1)
 */
const CHARACTER_EXTRACTION_SYSTEM = `ROLE: You are an expert character analyst for video production.

GOAL: Watch the ENTIRE video and identify ALL distinct characters/people visible.
This extraction happens BEFORE scene generation to ensure consistent naming throughout.

OUTPUT: Return a JSON object with:
1. "characters" array - ALL distinct people with detailed fixed attributes
2. "background" string - Main environment/setting description

CHARACTER IDENTIFICATION RULES (CRITICAL):
- Identify EVERY distinct person who appears in the video
- Assign consistent, specific names (NOT generic like "Chef" then "Chef Marco" - pick ONE name)
- For named characters (if name is mentioned/shown): use that exact name
- For unnamed characters: assign descriptive names based on role: "The Host", "Guest Sarah", "Narrator Mike"
- Include timestamps of first appearance for each character
- Track ALL physical attributes that remain constant throughout

WHAT TO INCLUDE FOR EACH CHARACTER:
- name: Consistent identifier used throughout (e.g., "Chef Marco", "Host Alex", "The Narrator")
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

BACKGROUND DESCRIPTION:
- Describe the main environment/setting where most action takes place
- Include: location type, key elements, lighting mood, color palette
- Example: "rustic farmhouse kitchen, copper pots on wall, wooden beams, warm morning sunlight"

EDGE CASES:
- If NO visible characters (only objects, text, graphics): return empty characters array
- If characters are only partially visible: describe what IS visible
- If multiple outfits: describe the FIRST/primary outfit in baseOutfit

STRICTNESS:
- Return ONLY valid JSON according to the schema
- Do NOT include camera terms in character descriptions
- Use objective, visual facts only`;

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
      role: "user",
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

// ============================================================================
// PHASE 0: Cinematic Color Profile Extraction (BEFORE character extraction)
// ============================================================================

/**
 * System instruction for color profile extraction (Phase 0)
 */
const COLOR_PROFILE_EXTRACTION_SYSTEM = `ROLE: You are an expert cinematographer and colorist analyzing video footage.

GOAL: Extract a comprehensive cinematic color profile from the video that can be used to maintain exact visual consistency when generating new scenes.

ANALYZE THE ENTIRE VIDEO to identify:
1. DOMINANT COLORS (5-8 colors): The key colors that define the video's palette
2. COLOR TEMPERATURE: Warm/cool/neutral/mixed with estimated Kelvin value
3. CONTRAST: Level and style (lifted blacks, crushed blacks, etc.)
4. SHADOWS: Color cast, density, and falloff characteristics
5. HIGHLIGHTS: Color cast, handling, and bloom presence
6. FILM STOCK: What film stock or digital color profile would match this look
7. MOOD: Primary mood, atmosphere, and emotional tone
8. GRAIN: Amount, type, and pattern
9. POST-PROCESSING: Color grade style, saturation, vignette, split-toning

OUTPUT: Return ONLY valid JSON according to the schema.

COLOR IDENTIFICATION RULES:
- Extract EXACT hex color values where possible
- Name colors cinematically with rich mood context:
  * Examples: "deep ocean mystery blue", "golden hour amber", "vintage warm coral", "clinical steel teal"
  * Avoid generic names like just "blue" or "warm orange"
  * Include emotional/atmospheric qualities in the name itself
- Identify emotional associations (mysterious, warm, nostalgic, clinical, energetic, melancholic, hopeful, tense, intimate, epic, vintage, modern, organic, synthetic, cold)
- Specify usage context (skin tones, backgrounds, accents, shadows, highlights)
- Consider both foreground and background color palettes

TECHNICAL ANALYSIS:
- Estimate color temperature in Kelvin (e.g., 5600K for daylight, 3200K for tungsten)
- Identify contrast style (film-like lifted blacks, digital crushed blacks, etc.)
- Note shadow color casts (blue, purple, green tints)
- Note highlight handling (soft roll-off, hard clip, warm/cool bloom)

FILM STOCK REFERENCE:
- Suggest which film stock (Kodak Portra, Fuji Superia, etc.) or digital profile matches
- Describe the characteristics that led to this suggestion

STRICTNESS:
- Return ONLY valid JSON according to the schema
- Use specific, measurable values where possible
- Be consistent with your analysis across the entire video`;

/**
 * User prompt for color profile extraction
 */
const COLOR_PROFILE_EXTRACTION_USER = `Analyze this video and extract a comprehensive cinematic color profile.

REQUIREMENTS:
1. Identify the 5-8 dominant colors with exact hex values
2. Determine color temperature category and estimate Kelvin value
3. Analyze contrast level, shadow characteristics, and highlight handling
4. Suggest a matching film stock or digital color profile
5. Describe the overall mood and atmosphere
6. Note any grain or post-processing characteristics

Return ONLY valid JSON according to the schema.`;

/**
 * Response schema for color profile extraction
 */
const COLOR_PROFILE_EXTRACTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    dominantColors: {
      type: "ARRAY",
      description: "5-8 dominant colors defining the video palette",
      items: {
        type: "OBJECT",
        properties: {
          hex: { type: "STRING", description: "Hex color value (e.g., '#FF5733')" },
          name: { type: "STRING", description: "Cinematic color name with mood context (e.g., 'deep ocean mystery blue', 'golden hour amber', 'vintage warm coral', 'clinical steel teal')" },
          moods: {
            type: "ARRAY",
            description: "Mood/emotion tags: mysterious, warm, clinical, nostalgic, energetic, melancholic, hopeful, tense, intimate, epic, vintage, modern, organic, synthetic, cold, professional, dramatic, playful, romantic, harsh, soft, bold, serene, ominous, luxurious",
            items: { type: "STRING" }
          },
          usage: { type: "STRING", description: "How this color is used (e.g., 'accent', 'background', 'skin tones', 'shadows', 'highlights')" },
        },
        required: ["hex", "name", "moods", "usage"],
      },
    },
    colorTemperature: {
      type: "OBJECT",
      properties: {
        category: { type: "STRING", description: "warm, cool, neutral, or mixed" },
        kelvinEstimate: { type: "NUMBER", description: "Estimated color temperature in Kelvin" },
        description: { type: "STRING", description: "Description of the temperature characteristics" },
      },
      required: ["category", "kelvinEstimate", "description"],
    },
    contrast: {
      type: "OBJECT",
      properties: {
        level: { type: "STRING", description: "low, medium, high, or extreme" },
        style: { type: "STRING", description: "Contrast style (e.g., 'film-like lifted blacks', 'digital crushed')" },
        blackPoint: { type: "STRING", description: "Black point characteristics (e.g., 'lifted', 'crushed', 'neutral')" },
        whitePoint: { type: "STRING", description: "White point characteristics (e.g., 'soft roll-off', 'hard clip')" },
      },
      required: ["level", "style", "blackPoint", "whitePoint"],
    },
    shadows: {
      type: "OBJECT",
      properties: {
        color: { type: "STRING", description: "Shadow color cast (e.g., 'blue-tinted', 'purple', 'neutral')" },
        density: { type: "STRING", description: "Shadow density (e.g., 'deep', 'transparent', 'medium')" },
        falloff: { type: "STRING", description: "Shadow falloff (e.g., 'gradual', 'hard', 'soft')" },
      },
      required: ["color", "density", "falloff"],
    },
    highlights: {
      type: "OBJECT",
      properties: {
        color: { type: "STRING", description: "Highlight color cast (e.g., 'warm golden', 'cool white', 'neutral')" },
        handling: { type: "STRING", description: "How highlights are handled (e.g., 'soft roll-off', 'blown out', 'retained detail')" },
        bloom: { type: "BOOLEAN", description: "Whether bloom/glow is present in highlights" },
      },
      required: ["color", "handling", "bloom"],
    },
    filmStock: {
      type: "OBJECT",
      properties: {
        suggested: { type: "STRING", description: "Suggested matching film stock (e.g., 'Kodak Portra 400', 'Fuji Superia')" },
        characteristics: { type: "STRING", description: "Key characteristics that led to this suggestion" },
        digitalProfile: { type: "STRING", description: "Alternative digital color profile if applicable" },
      },
      required: ["suggested", "characteristics"],
    },
    mood: {
      type: "OBJECT",
      properties: {
        primary: { type: "STRING", description: "Primary mood (e.g., 'warm and inviting', 'cold and clinical')" },
        atmosphere: { type: "STRING", description: "Overall atmosphere (e.g., 'cozy', 'industrial', 'romantic')" },
        emotionalTone: { type: "STRING", description: "Emotional tone conveyed by colors (e.g., 'nostalgic', 'energetic', 'melancholic')" },
      },
      required: ["primary", "atmosphere", "emotionalTone"],
    },
    grain: {
      type: "OBJECT",
      properties: {
        amount: { type: "STRING", description: "none, subtle, moderate, or heavy" },
        type: { type: "STRING", description: "Type of grain (e.g., 'fine', 'coarse', 'organic', 'digital noise')" },
        pattern: { type: "STRING", description: "Grain pattern (e.g., 'uniform', 'clustered', 'film-like')" },
      },
      required: ["amount", "type", "pattern"],
    },
    postProcessing: {
      type: "OBJECT",
      properties: {
        colorGrade: { type: "STRING", description: "Overall color grade style (e.g., 'orange and teal', 'desaturated', 'vibrant')" },
        saturation: { type: "STRING", description: "Saturation level (e.g., 'muted', 'normal', 'punchy', 'oversaturated')" },
        vignettePresent: { type: "BOOLEAN", description: "Whether vignetting is present" },
        splitToning: {
          type: "OBJECT",
          properties: {
            shadows: { type: "STRING", description: "Shadow split-tone color" },
            highlights: { type: "STRING", description: "Highlight split-tone color" },
          },
        },
      },
      required: ["colorGrade", "saturation", "vignettePresent"],
    },
    confidence: {
      type: "NUMBER",
      description: "Confidence level of the analysis (0.0 to 1.0)",
    },
  },
  required: ["dominantColors", "colorTemperature", "contrast", "shadows", "highlights", "filmStock", "mood", "grain", "postProcessing"],
};

/**
 * Build color profile extraction request for Phase 0
 * This extracts the cinematic color profile BEFORE character extraction
 */
export function buildColorProfileExtractionPrompt(options: {
  videoUrl: string;
  startTime?: string;
  endTime?: string;
}): GeminiRequestBody {
  let userPrompt = COLOR_PROFILE_EXTRACTION_USER;

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
      parts: [{ text: COLOR_PROFILE_EXTRACTION_SYSTEM }],
      role: "user",
    },
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: COLOR_PROFILE_EXTRACTION_SCHEMA,
    },
  };
}

/**
 * Parse color profile extraction response from Gemini API
 */
export function parseColorProfileResponse(response: {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
}): ColorProfileExtractionResult {
  const candidate = response?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No text response from Gemini API for color profile extraction");
  }

  try {
    const parsed = JSON.parse(text);
    return normalizeColorProfile(parsed);
  } catch {
    // Try extracting JSON from formatted text
  }

  // Try extracting JSON from markdown/formatted response
  const extracted = extractJsonFromText(text);
  try {
    const parsed = JSON.parse(extracted);
    return normalizeColorProfile(parsed);
  } catch (parseError) {
    const preview = text.substring(0, 300);
    const errorMsg = parseError instanceof Error ? parseError.message : "Unknown parse error";
    throw new Error(
      `Failed to parse color profile response as JSON. Error: ${errorMsg}. Response preview: ${preview}${text.length > 300 ? "..." : ""}`
    );
  }
}

/**
 * Normalize color profile extraction result
 */
function normalizeColorProfile(parsed: Record<string, unknown>): ColorProfileExtractionResult {
  // Normalize dominant colors
  const dominantColors: CinematicProfile["dominantColors"] = [];
  if (Array.isArray(parsed.dominantColors)) {
    for (const color of parsed.dominantColors) {
      if (typeof color === "object" && color !== null) {
        const colorObj = color as Record<string, unknown>;
        dominantColors.push({
          hex: String(colorObj.hex || "#000000"),
          name: String(colorObj.name || "unknown"),
          usage: String(colorObj.usage || "general"),
          semanticName: String(colorObj.name || "unknown"), // Will be enriched later
          moods: Array.isArray(colorObj.moods) ? (colorObj.moods as string[]) : [],
          temperature: "neutral", // Will be determined by enrichment
          psychologyNotes: undefined,
          confidence: undefined,
        });
      }
    }
  }

  // Normalize color temperature
  const tempObj = (parsed.colorTemperature || {}) as Record<string, unknown>;
  const colorTemperature: CinematicProfile["colorTemperature"] = {
    category: (tempObj.category as "warm" | "cool" | "neutral" | "mixed") || "neutral",
    kelvinEstimate: Number(tempObj.kelvinEstimate) || 5600,
    description: String(tempObj.description || ""),
  };

  // Normalize contrast
  const contrastObj = (parsed.contrast || {}) as Record<string, unknown>;
  const contrast: CinematicProfile["contrast"] = {
    level: (contrastObj.level as "low" | "medium" | "high" | "extreme") || "medium",
    style: String(contrastObj.style || ""),
    blackPoint: String(contrastObj.blackPoint || ""),
    whitePoint: String(contrastObj.whitePoint || ""),
  };

  // Normalize shadows
  const shadowsObj = (parsed.shadows || {}) as Record<string, unknown>;
  const shadows: CinematicProfile["shadows"] = {
    color: String(shadowsObj.color || "neutral"),
    density: String(shadowsObj.density || "medium"),
    falloff: String(shadowsObj.falloff || "gradual"),
  };

  // Normalize highlights
  const highlightsObj = (parsed.highlights || {}) as Record<string, unknown>;
  const highlights: CinematicProfile["highlights"] = {
    color: String(highlightsObj.color || "neutral"),
    handling: String(highlightsObj.handling || "soft roll-off"),
    bloom: Boolean(highlightsObj.bloom),
  };

  // Normalize film stock
  const filmObj = (parsed.filmStock || {}) as Record<string, unknown>;
  const filmStock: CinematicProfile["filmStock"] = {
    suggested: String(filmObj.suggested || "digital"),
    characteristics: String(filmObj.characteristics || ""),
    digitalProfile: filmObj.digitalProfile ? String(filmObj.digitalProfile) : undefined,
  };

  // Normalize mood
  const moodObj = (parsed.mood || {}) as Record<string, unknown>;
  const mood: CinematicProfile["mood"] = {
    primary: String(moodObj.primary || ""),
    atmosphere: String(moodObj.atmosphere || ""),
    emotionalTone: String(moodObj.emotionalTone || ""),
  };

  // Normalize grain
  const grainObj = (parsed.grain || {}) as Record<string, unknown>;
  const grain: CinematicProfile["grain"] = {
    amount: (grainObj.amount as "none" | "subtle" | "moderate" | "heavy") || "none",
    type: String(grainObj.type || ""),
    pattern: String(grainObj.pattern || ""),
  };

  // Normalize post-processing
  const postObj = (parsed.postProcessing || {}) as Record<string, unknown>;
  const splitToningObj = postObj.splitToning as Record<string, unknown> | undefined;
  const postProcessing: CinematicProfile["postProcessing"] = {
    colorGrade: String(postObj.colorGrade || ""),
    saturation: String(postObj.saturation || "normal"),
    vignettePresent: Boolean(postObj.vignettePresent),
    splitToning: splitToningObj ? {
      shadows: String(splitToningObj.shadows || ""),
      highlights: String(splitToningObj.highlights || ""),
    } : undefined,
  };

  const profile: CinematicProfile = {
    dominantColors,
    colorTemperature,
    contrast,
    shadows,
    highlights,
    filmStock,
    mood,
    grain,
    postProcessing,
  };

  return {
    profile,
    confidence: Number(parsed.confidence) || 0.8,
  };
}

/**
 * Enrich extracted color profile with semantic names and mood data
 * Uses hybrid approach: Gemini names + fallback to local vocabulary
 */
export async function enrichExtractedProfile(
  rawProfile: CinematicProfile
): Promise<CinematicProfile> {
  // Import color mapper utilities
  const { enrichColorEntry, hasGoodSemanticName, hasGoodMoods } = await import('./colorMapper');

  const enrichedColors = rawProfile.dominantColors.map(color => {
    // Check if Gemini provided good semantic data
    const hasGoodName = hasGoodSemanticName(color.semanticName);
    const hasMoods = hasGoodMoods(color.moods);

    // If Gemini did well, return as-is (already EnrichedColorEntry)
    if (hasGoodName && hasMoods) {
      return color;
    }

    // Otherwise, enrich using local vocabulary
    return enrichColorEntry(color);
  });

  return { ...rawProfile, dominantColors: enrichedColors };
}

/**
 * Build cinematic profile context for scene generation prompt
 * This context is injected into buildScenePrompt when a color profile is available
 */
export function buildCinematicProfileContext(profile: CinematicProfile): string {
  let context = `\n\n=== CINEMATIC PROFILE (PHASE 0 - USE EXACTLY) ===\n`;
  context += `CRITICAL: Apply these EXACT color values and characteristics to ALL generated scenes.\n`;
  context += `Do NOT infer or modify these values - use them verbatim.\n\n`;

  // Dominant colors with semantic descriptions
  context += `DOMINANT COLORS (apply these exact color characteristics):\n`;

  // Import color mapper utility for semantic description building
  const { buildSemanticColorDescription } = require('./colorMapper');

  for (const color of profile.dominantColors) {
    const semanticDesc = buildSemanticColorDescription(color, true);
    context += `- ${semanticDesc} - ${color.usage}\n`;

    // DEV ONLY: Add hex reference in development
    if (process.env.NODE_ENV === 'development') {
      context += `  [Technical reference: ${color.hex}]\n`;
    }
  }

  // Color temperature
  context += `\nCOLOR TEMPERATURE:\n`;
  context += `- Category: ${profile.colorTemperature.category}\n`;
  context += `- Kelvin: ${profile.colorTemperature.kelvinEstimate}K\n`;
  context += `- ${profile.colorTemperature.description}\n`;

  // Contrast
  context += `\nCONTRAST:\n`;
  context += `- Level: ${profile.contrast.level}\n`;
  context += `- Style: ${profile.contrast.style}\n`;
  context += `- Black point: ${profile.contrast.blackPoint}\n`;
  context += `- White point: ${profile.contrast.whitePoint}\n`;

  // Shadows & Highlights
  context += `\nSHADOWS: ${profile.shadows.color}, ${profile.shadows.density} density, ${profile.shadows.falloff} falloff\n`;
  context += `HIGHLIGHTS: ${profile.highlights.color}, ${profile.highlights.handling}${profile.highlights.bloom ? ", with bloom" : ""}\n`;

  // Film stock
  context += `\nFILM STOCK REFERENCE:\n`;
  context += `- Suggested: ${profile.filmStock.suggested}\n`;
  context += `- Characteristics: ${profile.filmStock.characteristics}\n`;
  if (profile.filmStock.digitalProfile) {
    context += `- Digital profile: ${profile.filmStock.digitalProfile}\n`;
  }

  // Mood
  context += `\nMOOD:\n`;
  context += `- Primary: ${profile.mood.primary}\n`;
  context += `- Atmosphere: ${profile.mood.atmosphere}\n`;
  context += `- Emotional tone: ${profile.mood.emotionalTone}\n`;

  // Grain
  context += `\nGRAIN: ${profile.grain.amount}`;
  if (profile.grain.amount !== "none") {
    context += ` - ${profile.grain.type}, ${profile.grain.pattern}`;
  }
  context += `\n`;

  // Post-processing
  context += `\nPOST-PROCESSING:\n`;
  context += `- Color grade: ${profile.postProcessing.colorGrade}\n`;
  context += `- Saturation: ${profile.postProcessing.saturation}\n`;
  context += `- Vignette: ${profile.postProcessing.vignettePresent ? "yes" : "no"}\n`;
  if (profile.postProcessing.splitToning) {
    context += `- Split-toning: shadows=${profile.postProcessing.splitToning.shadows}, highlights=${profile.postProcessing.splitToning.highlights}\n`;
  }

  context += `\n=== END CINEMATIC PROFILE ===\n`;

  return context;
}

/**
 * Convert cinematic profile to StyleObject fields
 * This pre-populates style fields from the extracted profile
 */
export function cinematicProfileToStyleFields(profile: CinematicProfile): Partial<StyleObject> {
  // Build palette string from dominant colors
  const paletteColors = profile.dominantColors.map(c => `${c.name} (${c.hex})`).join(", ");

  return {
    palette: paletteColors,
    color_temperature: `${profile.colorTemperature.category}, ${profile.colorTemperature.kelvinEstimate}K - ${profile.colorTemperature.description}`,
    contrast: `${profile.contrast.level} - ${profile.contrast.style}, black point: ${profile.contrast.blackPoint}, white point: ${profile.contrast.whitePoint}`,
    film_stock_or_profile: profile.filmStock.suggested + (profile.filmStock.digitalProfile ? ` / ${profile.filmStock.digitalProfile}` : ""),
    grain: `${profile.grain.amount}${profile.grain.amount !== "none" ? ` - ${profile.grain.type}, ${profile.grain.pattern}` : ""}`,
    post_processing: `${profile.postProcessing.colorGrade}, ${profile.postProcessing.saturation} saturation${profile.postProcessing.vignettePresent ? ", vignette" : ""}${profile.postProcessing.splitToning ? `, split-toning (${profile.postProcessing.splitToning.shadows}/${profile.postProcessing.splitToning.highlights})` : ""}`,
    mood: `${profile.mood.primary} - ${profile.mood.atmosphere}, ${profile.mood.emotionalTone}`,
    lighting_style: `${profile.colorTemperature.category} ${profile.colorTemperature.kelvinEstimate}K, shadows: ${profile.shadows.color} (${profile.shadows.density}), highlights: ${profile.highlights.color} (${profile.highlights.handling})`,
  };
}

// ============================================================================
// PHASE 2: Scene Generation (uses pre-extracted characters)
// ============================================================================

/**
 * System instruction for scene analysis
 */
const SYSTEM_INSTRUCTION = `ROLE: Expert film director and visual analyst optimized for VEO 3 video generation.

SCENE COUNT: EXACTLY {SceneNumber} scenes. ~8s/scene. Under-generating = failure.
- Split on: cuts, location/time/subject/camera changes, speaker changes, action beats, reaction shots, transitions.
- Do NOT fabricate content; only split where visually justified.

OUTPUT: JSON ARRAY per schema. Every field required.
- description: 2-4 sentences, present tense, third person.
  • Subject + setting first, then action verbs with motion path/trajectory and body mechanics.
  • Camera behavior with position phrase: "[Shot] with camera at [location] (thats where the camera is)"
  • Object/character interactions with cause→effect beats.
  • Sensory details, lighting mood, color palette, shot composition.
  • Clear start/end conditions. No vague words, metaphors, inner thoughts, or off-screen events.
- Maintain chronological coherence with previous scenes.
- Re-appearing characters use identical descriptions.

TEMPORAL: Timestamps strictly increasing. New scene on clear visual change (cut, location/time shift, new subject, camera angle change). Same content across time = one scene.

PROMPT FIELD: Synthesize all fields into one descriptive paragraph (style, lighting, composition, technical, narrative action). Include camera position phrase and audio design.

STYLE: Populate as DETAILED OBJECT. ONE canonical style, IDENTICAL across ALL scenes (byte-for-byte). Copy first scene's style to all others. Scene-specific composition/lighting go in their own fields, NOT in 'style'.

CHARACTER FORMAT: "Name - tags..." (15+ attributes for VEO 3 consistency)
- Name first (real name, role name like "Chef Marco", or descriptive like "The Host")
- Tags: gender, age, ethnicity/skin tone, body type, face shape, hair (length+style+color+texture), facial hair, distinctive features, clothing (top/bottom/shoes/outerwear with fabric/fit/pattern), accessories
- NEVER put camera terms in character field → use composition fields
- EXTRA ATTENTION: hair details, facial hair, face shape, tattoos/body art

WRONG: ❌ "closeup of man" ❌ "A person" ❌ "Hand holding knife" ❌ "medium shot of woman"

CHARACTER SKELETON (CONSISTENCY):
- First appearance = CANONICAL fixed skeleton with all physical traits + base outfit
- Subsequent appearances = EXACT SAME skeleton copied verbatim
- Temporary changes (accessories, expression, pose, outfit) → characterVariations field
- Physical traits NEVER change across scenes

EXPRESSION CONTROL (anti-model-face):
- MICRO-EXPRESSIONS to avoid flat "model face": eye squints, brow furrows, head tilts, lip quiver
- EYE DIRECTION: up=thinking, down=sad, camera=direct address, away=uncomfortable
- BODY LANGUAGE: upright=confident, slouched=defeated, leaning=engaged, rigid=tense
- EMOTIONAL ARC per scene: start state → transition → end state (e.g., "confused → processing → confident smile")
- Always: "natural, unstaged, slight asymmetry, authentic human moment"
→ Populate expressionControl + emotionalArc fields for every scene with characters

DIALOGUE (colon format — prevents subtitles):
- COLON RULE: "[Character] [action] and says: '[line]' [tone]"
  ❌ WRONG: "[Character] says '[line]'" — triggers subtitles
- 8-SECOND RULE: max 12-15 words/line, 20-25 syllables/line
- Phonetic spelling for unusual names (e.g., "foh-fur's" not "Fofur's")
- Specify tone/delivery + body language cues
- Multiple speakers: name each character explicitly before their line
→ Populate dialogue array: character, line, delivery, emotion

CAMERA POSITIONING:
- KEY PHRASE: "(thats where the camera is)" — triggers camera-aware processing
- Format: "[Shot] with camera at [location] (thats where the camera is)"
- Height: ground-level / eye-level / overhead / aerial
- Distance: intimate / close / medium / far / extreme
- Movement quality: natural / fluid / energetic / deliberate / graceful
→ Populate enhancedCamera: position, height, distance, positionPhrase

COMPOSITION & LIGHTING:
- LENS: DoF (shallow/deep), aperture (f/1.4 bokeh, f/2.8), type (standard/wide/telephoto/macro/anamorphic), flare
- COLOR GRADING (semantic, not hex): teal-orange (epic) | warm-orange (nostalgic) | cool-blue (professional) | desaturated (dramatic) | noir (classic)
  Split-toning: "[mood] [color] shadows + [mood] [color] highlights"
- LIGHTING: three-point / rembrandt / golden-hour / chiaroscuro / neon — describe key, fill, rim lights
- COMPOSITION: rule-of-thirds / leading-lines / frame-within-frame / symmetry / negative-space
→ Populate lensEffects, colorGrading, advancedLighting, advancedComposition fields

CONTEXT PER SCENE:
- Emotional: mood, energy, dynamics, body language
- Environmental: indoor/outdoor, weather, time of day, cultural elements, background activity
- Technical: quality, camera stability, lighting conditions, audio cues, editing style

SCENE TRANSITIONS: Identify cuts vs continuous shots, location/time jumps, subject/lighting changes.

STRICTNESS: Valid JSON only. Objective visual facts. Character consistency across scenes.

NEGATIVE PROMPT: Include global negatives + scene-specific exclusions.
- Add context-appropriate exclusions (anachronisms, continuity violations, physics errors)
- Never contradict positive description
- Format: [global], [scene-specific]
- Physics: dropped items stay dropped, exited characters don't teleport back, maintain spatial consistency`;

// CHARACTER_ANALYSIS_PROMPT removed - character rules consolidated into SYSTEM_INSTRUCTION (single source of truth)

// ============================================================================
// Media Type Specific Instructions
// ============================================================================

/**
 * Image-specific system instructions for still image generation
 * Optimized for: Midjourney, DALL-E, Flux, Stable Diffusion
 */
const IMAGE_GENERATION_INSTRUCTIONS = `
=== IMAGE GENERATION MODE (STILL IMAGES) ===
Generate scenes optimized for STILL IMAGE generation (Midjourney, DALL-E, Flux).

CRITICAL REQUIREMENTS:
- Each scene represents a SINGLE DECISIVE MOMENT - one frozen frame
- Describe static poses and expressions (no implied movement)
- Focus on rich environmental and compositional detail
- NO motion blur or implied movement descriptions
- Consider aspect ratio for framing composition
- Emphasize texture, material quality, and lighting details

IMAGE-SPECIFIC GUIDANCE:
- Use decisive, frozen moment language: "stands", "holds", "gazes" (not "walking", "reaching")
- Describe the exact position of all elements
- Include depth cues (foreground/midground/background)
- Specify material textures (velvet, brushed metal, rough wood)
- Note reflections, highlights, and shadow details

DO NOT:
- Describe motion or action sequences
- Use verbs that imply ongoing movement
- Include camera movement descriptions (pan, dolly, etc.)
- Reference time progression within a scene
=== END IMAGE GENERATION MODE ===`;

/**
 * Video-specific system instructions for video generation
 * Optimized for: VEO, Sora, Runway Gen-3, Pika
 */
const VIDEO_GENERATION_INSTRUCTIONS = `
=== VIDEO GENERATION MODE (VEO 3 OPTIMIZED) ===
Generate scenes optimized for VEO 3 video generation.

CRITICAL REQUIREMENTS:
- Each scene represents a 4-8 SECOND VIDEO CLIP
- Describe explicit motion paths and trajectories
- Include camera position with "(thats where the camera is)" syntax
- Note the START and END states of any motion
- Describe subject motion AND camera motion separately
- Consider transitions between scenes for continuity

VIDEO-SPECIFIC FIELDS (REQUIRED):
1. video.duration: Estimated clip length (4-8 seconds typical)
2. video.cameraMovement: Type (static/pan/tilt/dolly/crane/handheld/orbital/zoom), direction, intensity
3. video.subjectMotion: Primary action, secondary motion, background motion

MOTION DESCRIPTION GUIDANCE:
- Use active verbs: "walks from left to right", "leans forward slowly"
- Specify direction and speed: "camera dollies in gradually", "quick pan left"
- Note motion intensity: subtle, moderate, dynamic
- Describe cause-and-effect beats: "as she pours, steam rises"

CAMERA MOVEMENT TYPES:
- static: Fixed position, no movement
- pan: Horizontal rotation (left/right)
- tilt: Vertical rotation (up/down)
- dolly: Camera moves forward/backward
- crane: Vertical camera movement
- handheld: Shaky, documentary style
- orbital: Camera orbits subject
- zoom: Lens focal length change
- tracking: Camera follows subject laterally

AUDIO DESIGN (per scene — follow AUDIO INSTRUCTIONS section below):
- Only populate audio layers that are ENABLED in the AUDIO INSTRUCTIONS section
- For DISABLED layers: do NOT populate the corresponding audio sub-field, and add to negations
- Environmental audio per location (e.g., kitchen: "sizzling, chopping, boiling")
- Music: "[mood] [genre] [instruments], [tempo]" with volume: background/prominent/featured
- SFX: "[sound] as [trigger]" (e.g., "Footsteps on gravel as character walks")
- HALLUCINATION PREVENTION: specify what TO hear AND what NOT to hear (negations list)
- Include room tone: "professional atmosphere" or "natural room tone"
→ Populate audio field per AUDIO INSTRUCTIONS: environmental, music, soundEffects, negations

PHYSICS-AWARE MOTION:
- Keywords: "realistic physics", "natural fluid dynamics", "proper weight and balance"
- Materials: fabric (flowing/stiff/billowing), hair (static/windswept/bouncing), liquid (splashing/dripping/pouring), smoke (rising/dispersing)
- Gravity: normal / low (floating) / zero (weightless) / heavy (exaggerated)
→ Populate physicsAwareness field

CONTINUITY BETWEEN SCENES:
- Use video.continuity to track scene relationships
- matchAction: true if motion continues from previous scene
- matchColor: true to maintain color grade
- Note any transitions (cut, fade, dissolve)

QUALITY SELF-CHECK (target 8-10/10 = Master level):
1. CHARACTER: 15+ physical attributes | 2. SCENE: 10+ environmental elements
3. CAMERA: shot+angle+movement+"(thats where the camera is)" | 4. LIGHTING: professional setup
5. AUDIO: explicit sounds + negations | 6. DIALOGUE: colon format + 8-sec rule
7. NEGATIVE PROMPTS: comprehensive | 8. TECHNICAL: broadcast quality
9. EXPRESSION: micro-expressions + emotional arc | 10. DURATION: optimized for 8s
=== END VIDEO GENERATION MODE ===`;

/**
 * Get media-specific instructions based on mediaType
 */
export function getMediaTypeInstructions(mediaType: "image" | "video" = "video"): string {
  return mediaType === "image" ? IMAGE_GENERATION_INSTRUCTIONS : VIDEO_GENERATION_INSTRUCTIONS;
}

// ============================================================================
// VEO 3: Selfie Mode (genuine mode switch — only toggle kept)
// ============================================================================

/**
 * Selfie/POV mode instructions — appended when selfie mode is enabled.
 * This is a genuine shot-type change, not a technique to absorb into base.
 */
const SELFIE_MODE_INSTRUCTIONS = `
=== SELFIE/POV MODE ===
Formula: "A selfie video of [CHARACTER] [ACTIVITY]. [He/She] holds camera at arm's length. Arm clearly visible. Occasionally looking into camera before [ACTION]. Slightly grainy, film-like. Says: '[DIALOGUE]' [TONE]. Ends with [GESTURE]."
- Required: arm visible, natural eye contact, film-like quality, closing gesture
- Camera shake: none / subtle / natural
→ Populate selfieSpec field
=== END SELFIE/POV MODE ===`;

/**
 * Base user prompt for scene analysis
 * NOTE: Text overlay exclusions moved to negativePrompt field for better separation
 */
const BASE_USER_PROMPT = `Analyze this video scene-by-scene according to the provided JSON schema and system instructions. Pay special attention to hair details (length, style, texture, color), clothing patterns, textures, and accessories. Provide detailed descriptions for character appearance including specific hair length, hairstyle patterns, clothing details, fabric textures, and decorative elements.`;

/**
 * Response schema for Gemini API
 */
const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      description: {
        type: "STRING",
        description:
          "Optimized scene narrative (2–4 present‑tense sentences): subject+setting, explicit actions/trajectory, camera behavior, interactions, sensory details, character dynamics, environmental context, lighting mood, color palette, shot composition, and clear start/end of the scene",
      },
      prompt: { type: "STRING" },
      negativePrompt: {
        type: "STRING",
        description: "Comma-separated unwanted elements. Include global + scene-specific additions.",
      },
      character: { type: "STRING", description: "Format: 'Name - appearance tags'. MUST start with name (e.g., 'Chef Marco - male, 40s, white coat...'). NEVER include camera terms like closeup, medium shot, POV here." },
      characterVariations: {
        type: "STRING",
        description: "JSON string of per-scene character variations. Format: {\"CharacterName\": {\"accessories\": \"...\", \"expression\": \"...\", \"pose\": \"...\", \"outfit\": \"...\"}}. Use for temporary changes like accessories, expressions, poses, or outfit changes.",
      },
      object: { type: "STRING", description: "Main objects visible in scene (not people)" },
      composition: {
        type: "OBJECT",
        description:
          "Camera framing for this scene. ALL camera angles and shot types go HERE, never in character field.",
        properties: {
          angle: { type: "STRING", description: "Camera angle: eye-level, low-angle, high-angle, dutch, bird's-eye, worm's-eye, over-the-shoulder, POV" },
          framing: { type: "STRING", description: "Shot type/distance: extreme-close-up, close-up, medium-close-up, medium-shot, medium-long-shot, full-shot, long-shot, extreme-long-shot" },
          focus: { type: "STRING", description: "What is in focus: subject's face, hands, environment, background blur, etc." },
        },
      },
      lighting: {
        type: "OBJECT",
        properties: {
          mood: { type: "STRING" },
          source: { type: "STRING" },
          shadows: { type: "STRING" },
        },
      },
      visual_specs: {
        type: "OBJECT",
        properties: {
          primary_subject: { type: "STRING" },
          environment: { type: "STRING" },
          key_details: { type: "STRING" },
        },
      },
      technical: {
        type: "OBJECT",
        properties: {
          quality: { type: "STRING" },
          colors: { type: "STRING" },
        },
      },
      style: {
        type: "OBJECT",
        description:
          "Extremely detailed style object to lock aesthetics with low variance",
        properties: {
          genre: { type: "STRING" },
          art_movement: { type: "STRING" },
          medium: { type: "STRING" },
          palette: { type: "STRING" },
          color_temperature: { type: "STRING" },
          contrast: { type: "STRING" },
          texture: { type: "STRING" },
          brushwork_or_line: { type: "STRING" },
          rendering_engine: { type: "STRING" },
          camera_lens: { type: "STRING" },
          focal_length: { type: "STRING" },
          depth_of_field: { type: "STRING" },
          film_stock_or_profile: { type: "STRING" },
          grain: { type: "STRING" },
          noise_reduction: { type: "STRING" },
          post_processing: { type: "STRING" },
          composition_style: { type: "STRING" },
          mood: { type: "STRING" },
          lighting_style: { type: "STRING" },
        },
      },
      shotSize: { type: "STRING", description: "Shot size hierarchy: EWS, WS, MWS, MS, MCU, CU, ECU" },
      enhancedCamera: {
        type: "OBJECT",
        description: "VEO 3 Camera positioning with '(thats where the camera is)' syntax",
        properties: {
          position: { type: "STRING", description: "Camera position description (at counter level, behind interviewer)" },
          height: { type: "STRING", description: "ground-level, eye-level, overhead, aerial" },
          distance: { type: "STRING", description: "intimate, close, medium, far, extreme" },
          positionPhrase: { type: "STRING", description: "Full phrase with '(thats where the camera is)' syntax" },
        },
      },
      lensEffects: {
        type: "OBJECT",
        description: "VEO 3 Lens Effects - DOF, bokeh, flare",
        properties: {
          type: { type: "STRING", description: "Lens type: standard, wide-angle, telephoto, macro, anamorphic" },
          depthOfField: { type: "STRING", description: "shallow, medium, deep, rack-focus" },
          aperture: { type: "STRING", description: "Aperture value (f/1.4, f/2.8)" },
          bokehStyle: { type: "STRING", description: "smooth, creamy, hexagonal" },
          flare: { type: "BOOLEAN", description: "Enable lens flare" },
        },
      },
      video: {
        type: "OBJECT",
        description: "Video-specific settings (only for video mediaType)",
        properties: {
          duration: { type: "NUMBER", description: "Scene duration in seconds (typically 4-8)" },
          fps: { type: "NUMBER", description: "Frames per second (24, 30, or 60)" },
          speed: { type: "STRING", description: "normal, slow-motion, or timelapse" },
          cameraMovement: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", description: "static, pan, tilt, dolly, crane, handheld, orbital, zoom, tracking" },
              direction: { type: "STRING", description: "left, right, up, down, in, out, clockwise, counterclockwise" },
              intensity: { type: "STRING", description: "subtle, moderate, dynamic" },
              path: { type: "STRING", description: "Natural language description of camera path" },
            },
          },
          subjectMotion: {
            type: "OBJECT",
            properties: {
              primary: { type: "STRING", description: "Main subject motion (e.g., 'Chef walks left to right')" },
              secondary: { type: "STRING", description: "Secondary motion (e.g., 'Steam rises from pot')" },
              background: { type: "STRING", description: "Background motion (e.g., 'Trees sway gently')" },
            },
          },
          transitionIn: { type: "STRING", description: "cut, fade, dissolve, wipe, or zoom" },
          transitionOut: { type: "STRING", description: "cut, fade, dissolve, wipe, or zoom" },
          continuity: {
            type: "OBJECT",
            description: "Inter-scene continuity tracking for batch coherence",
            properties: {
              matchAction: { type: "BOOLEAN", description: "True if motion continues from previous scene" },
              matchColor: { type: "BOOLEAN", description: "True to maintain color grade from previous scene" },
              previousSceneLink: { type: "STRING", description: "Brief description of what connects this scene to the previous one (e.g., 'continues Chef Marco's plating motion')" },
            },
          },
          audioCues: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Audio cues for the scene (e.g., 'fire crackling', 'knife on wood')",
          },
        },
      },
      movementQuality: { type: "STRING", description: "Movement quality: natural, fluid, graceful, energetic, deliberate" },
      expressionControl: {
        type: "OBJECT",
        description: "VEO 3 Expression Control - anti-model-face technique",
        properties: {
          primary: { type: "STRING", description: "Primary emotion" },
          microExpressions: { type: "STRING", description: "Subtle facial movements" },
          eyeMovement: { type: "STRING", description: "Eye direction and behavior" },
          bodyLanguage: { type: "STRING", description: "Posture and gestures" },
          antiModelFace: { type: "BOOLEAN", description: "Enable natural, non-model expression" },
        },
      },
      emotionalArc: {
        type: "OBJECT",
        description: "VEO 3 'This Then That' emotional progression",
        properties: {
          startState: { type: "STRING", description: "Initial emotional state" },
          middleState: { type: "STRING", description: "Transition state (optional)" },
          endState: { type: "STRING", description: "Final emotional state" },
          transitionType: { type: "STRING", description: "gradual, sudden, or building" },
        },
      },
      colorGrading: {
        type: "OBJECT",
        description: "VEO 3 Color Grading - palette, split-toning",
        properties: {
          palette: { type: "STRING", description: "Color palette: teal-orange, desaturated, warm-orange, cool-blue, noir" },
          shadowColor: { type: "STRING", description: "Hex color for shadows" },
          highlightColor: { type: "STRING", description: "Hex color for highlights" },
          saturation: { type: "STRING", description: "muted, normal, punchy" },
          filmEmulation: { type: "STRING", description: "Film stock emulation (Kodak Portra, Fuji Superia)" },
        },
      },
      advancedLighting: {
        type: "OBJECT",
        description: "VEO 3 Professional Lighting Setups",
        properties: {
          setup: { type: "STRING", description: "Lighting setup: three-point, rembrandt, golden-hour, chiaroscuro, neon" },
          keyLight: { type: "STRING", description: "Key light description" },
          fillLight: { type: "STRING", description: "Fill light description" },
          rimLight: { type: "BOOLEAN", description: "Enable rim lighting" },
          atmosphericEffects: { type: "STRING", description: "haze, fog, dust, rain" },
        },
      },
      audio: {
        type: "OBJECT",
        description: "VEO 3 Audio System - environmental audio, music, SFX, hallucination prevention",
        properties: {
          environmental: {
            type: "OBJECT",
            properties: {
              ambiance: { type: "STRING", description: "Location-appropriate ambient sounds" },
              intensity: { type: "STRING", description: "subtle, moderate, or prominent" },
              spatialPosition: { type: "STRING", description: "surrounding, distant left, close right" },
            },
          },
          music: {
            type: "OBJECT",
            properties: {
              mood: { type: "STRING", description: "Mood of music (tense, uplifting, melancholic)" },
              genre: { type: "STRING", description: "Music genre (orchestral, jazz, lo-fi)" },
              volume: { type: "STRING", description: "background, prominent, or featured" },
            },
          },
          soundEffects: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                sound: { type: "STRING", description: "Sound description" },
                trigger: { type: "STRING", description: "What triggers this sound" },
              },
            },
            description: "Specific sound effects synchronized to actions",
          },
          negations: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Sounds to prevent (audio hallucination prevention)",
          },
        },
      },
      dialogue: {
        type: "ARRAY",
        description: "VEO 3 Dialogue System - colon format for subtitle prevention",
        items: {
          type: "OBJECT",
          properties: {
            character: { type: "STRING", description: "Character name" },
            line: { type: "STRING", description: "Dialogue text (max 12-15 words for 8-sec rule)" },
            delivery: { type: "STRING", description: "Manner of delivery (whispered, shouted, with conviction)" },
            emotion: { type: "STRING", description: "Emotional state during dialogue" },
          },
        },
      },
    },
    required: [
      "description",
      "prompt",
      "character",
      "object",
      "composition",
      "lighting",
      "visual_specs",
      "technical",
      "style",
    ],
  },
};

/**
 * Convert a VoiceLanguage to a full AudioSettings object (all layers ON).
 * Used for backward-compatible callers that still pass VoiceLanguage.
 */
export function voiceLanguageToAudioSettings(voiceLang: VoiceLanguage): AudioSettings {
  return {
    voiceLanguage: voiceLang,
    music: true,
    soundEffects: true,
    environmentalAudio: true,
  };
}

/**
 * Add granular audio instructions to the user prompt.
 * For each layer: ON → instruct Gemini to populate; OFF → add to negations.
 * Explicit negatives prevent audio hallucination (Gemini adding music when you said no music).
 */
export function addAudioInstructions(
  prompt: string,
  audio: AudioSettings
): string {
  const enabled: string[] = [];
  const disabled: string[] = [];

  // Voice/Dialogue
  if (audio.voiceLanguage === "no-voice") {
    disabled.push("voice narration", "dialogue", "spoken words");
  } else {
    enabled.push(`${audio.voiceLanguage.toUpperCase()} voice narration and dialogue`);
  }

  // Music
  if (audio.music) {
    enabled.push("background music (mood, genre, tempo, instruments)");
  } else {
    disabled.push("background music", "musical score", "soundtrack");
  }

  // Sound Effects
  if (audio.soundEffects) {
    enabled.push("sound effects synchronized to actions");
  } else {
    disabled.push("sound effects", "foley sounds");
  }

  // Environmental Audio
  if (audio.environmentalAudio) {
    enabled.push("environmental/ambient audio (room tone, atmosphere)");
  } else {
    disabled.push("ambient audio", "environmental sounds", "room tone");
  }

  let instruction = `\n\n=== AUDIO INSTRUCTIONS (CRITICAL — FOLLOW EXACTLY) ===`;

  if (enabled.length > 0) {
    instruction += `\nENABLED audio layers (populate these in each scene's audio field):`;
    for (const layer of enabled) {
      instruction += `\n- ${layer}`;
    }
  }

  if (disabled.length > 0) {
    instruction += `\nDISABLED audio layers (do NOT generate these — add to audio.negations):`;
    for (const layer of disabled) {
      instruction += `\n- NO ${layer}`;
    }
    instruction += `\nHALLUCINATION PREVENTION: If any disabled sound appears, the generation is WRONG. Add all disabled sounds to the negations array.`;
  }

  // Voice-specific instructions
  if (audio.voiceLanguage !== "no-voice") {
    instruction += `\nVOICE: Add "voice" field with ${audio.voiceLanguage.toUpperCase()} narration text, dialogue, and tone.`;
  }

  instruction += `\n=== END AUDIO INSTRUCTIONS ===`;

  return prompt + instruction;
}

/**
 * Add voice instructions to user prompt.
 * Backward-compatible wrapper — converts VoiceLanguage to AudioSettings with all layers ON.
 */
export function addVoiceInstructions(
  prompt: string,
  voiceLang: VoiceLanguage
): string {
  return addAudioInstructions(prompt, voiceLanguageToAudioSettings(voiceLang));
}

/**
 * Format a character skeleton or legacy string for continuity context
 */
function formatCharacterForContext(charData: string | CharacterSkeleton): string {
  if (typeof charData === "string") {
    return charData;
  }

  // Format CharacterSkeleton as a consistent description
  const parts = [
    charData.name,
    charData.gender,
    charData.age,
    charData.ethnicity,
    charData.bodyType,
    charData.faceShape,
    charData.hair,
  ];

  if (charData.facialHair) {
    parts.push(charData.facialHair);
  }

  if (charData.distinctiveFeatures) {
    parts.push(charData.distinctiveFeatures);
  }

  parts.push(charData.baseOutfit);

  return parts.filter(Boolean).join(", ");
}

/**
 * Build continuity context for batched processing (both direct and hybrid modes)
 * Supports both legacy string descriptions and CharacterSkeleton objects
 */
/**
 * Extract unique locations from scene list
 */
function extractLocations(scenes: Array<{ visual_specs?: { environment?: string } }>): string[] {
  const locations = new Set<string>();
  scenes.forEach((scene) => {
    if (scene.visual_specs?.environment) {
      locations.add(scene.visual_specs.environment);
    }
  });
  return Array.from(locations);
}

/**
 * Extract unique actions/activities from scene descriptions
 * Uses generic -ing verb extraction rather than hardcoded domain verbs
 */
function extractActions(scenes: Array<{ description: string }>): string[] {
  const actions = new Set<string>();
  // Extract -ing words (gerunds/present participles) as action indicators
  const ingPattern = /\b([a-z]{3,}ing)\b/g;
  // Common non-action -ing words to exclude
  const excludeWords = new Set([
    "something", "nothing", "anything", "everything", "thing",
    "during", "morning", "evening", "clothing", "building",
    "setting", "lighting", "framing", "being", "having",
    "string", "ceiling", "feeling",
  ]);

  for (const scene of scenes) {
    const desc = scene.description.toLowerCase();
    let match;
    while ((match = ingPattern.exec(desc)) !== null) {
      const word = match[1];
      if (!excludeWords.has(word)) {
        actions.add(word);
      }
    }
  }
  return Array.from(actions).slice(0, 15); // Cap at 15 to keep context concise
}

export function buildContinuityContext(
  previousScenes: Array<{
    description: string;
    character?: string;
    visual_specs?: { environment?: string };
  }>,
  characterRegistry: Record<string, string | CharacterSkeleton>,
  summaryMode: boolean = false,  // Enable summary mode for large scene counts
  detailSceneCount: number = 5   // How many recent scenes to show in detail
): string {
  if (!previousScenes || previousScenes.length === 0) return "";

  let context = `\n\n=== CONTINUITY CONTEXT (CRITICAL - MUST MAINTAIN) ===\n`;

  // 1. Character Registry
  context += `\nESTABLISHED CHARACTERS (use EXACT descriptions when they reappear):\n`;
  for (const [, charData] of Object.entries(characterRegistry)) {
    const formatted = formatCharacterForContext(charData);
    // If skeleton, show structured format; if string, show as-is
    if (typeof charData === "object") {
      context += `- CHARACTER SKELETON: ${formatted}\n`;
    } else {
      context += `- ${formatted}\n`;
    }
  }

  // 2. Scene History
  // Use summary mode if we have more than 5 scenes to reduce token overhead
  const useSummary = summaryMode || previousScenes.length > 5;

  if (useSummary) {
    // Summary mode: Overview + last N scenes in detail
    context += `\n--- PREVIOUS SCENES (Summary) ---\n`;
    context += `Total scenes generated: ${previousScenes.length}\n`;

    const locations = extractLocations(previousScenes);
    if (locations.length > 0) {
      context += `Locations covered: ${locations.slice(0, 5).join(", ")}`;
      if (locations.length > 5) context += `, and ${locations.length - 5} more`;
      context += `\n`;
    }

    const actions = extractActions(previousScenes);
    if (actions.length > 0) {
      context += `Actions covered: ${actions.join(", ")}\n`;
    }

    // Show last N scenes in detail
    const recentScenes = previousScenes.slice(-detailSceneCount);
    context += `\n--- LAST ${recentScenes.length} SCENES (Full Detail) ---\n`;
    for (let i = 0; i < recentScenes.length; i++) {
      const sceneNum = previousScenes.length - detailSceneCount + i + 1;
      const scene = recentScenes[i];
      context += `Scene ${sceneNum}: ${scene.description}\n`;
      if (scene.character) {
        context += `  Characters: ${scene.character}\n`;
      }
      if (scene.visual_specs?.environment) {
        context += `  Location: ${scene.visual_specs.environment}\n`;
      }
    }
  } else {
    // Full history mode: Show all scenes
    context += `\n--- ALL PREVIOUS SCENES ---\n`;
    for (let i = 0; i < previousScenes.length; i++) {
      const scene = previousScenes[i];
      context += `Scene ${i + 1}: ${scene.description}\n`;
      if (scene.character) {
        context += `  Characters: ${scene.character}\n`;
      }
      if (scene.visual_specs?.environment) {
        context += `  Location: ${scene.visual_specs.environment}\n`;
      }
    }
  }

  // 3. Critical Instructions
  context += `\n--- CRITICAL INSTRUCTIONS ---\n`;
  context += `- Do NOT repeat any scene description from above\n`;
  context += `- Maintain character consistency using EXACT skeleton descriptions\n`;
  context += `- Continue the narrative flow from where previous scenes ended\n`;
  context += `- If a location/action was already covered, move to new content\n`;
  context += `- Avoid creating similar or duplicate scenes\n`;
  context += `=== END CONTINUITY CONTEXT ===\n`;

  return context;
}

/**
 * Format pre-extracted character skeleton for prompt inclusion
 */
function formatCharacterSkeletonForPrompt(char: CharacterSkeleton): string {
  const parts = [char.name];
  if (char.gender) parts.push(char.gender);
  if (char.age) parts.push(char.age);
  if (char.ethnicity) parts.push(char.ethnicity);
  if (char.bodyType) parts.push(char.bodyType);
  if (char.faceShape) parts.push(char.faceShape);
  if (char.hair) parts.push(char.hair);
  if (char.facialHair) parts.push(char.facialHair);
  if (char.distinctiveFeatures) parts.push(char.distinctiveFeatures);
  if (char.baseOutfit) parts.push(char.baseOutfit);
  return parts.join(", ");
}

/**
 * Build pre-extracted characters context for scene generation (Phase 2)
 */
function buildPreExtractedCharactersContext(
  characters: CharacterSkeleton[],
  background?: string
): string {
  if (characters.length === 0 && !background) return "";

  let context = `\n\n=== ESTABLISHED CHARACTERS & SETTING (PHASE 1 EXTRACTION - USE EXACTLY AS DEFINED) ===\n`;

  if (characters.length > 0) {
    context += `\nPRE-IDENTIFIED CHARACTERS (DO NOT RENAME OR MODIFY):\n`;
    for (const char of characters) {
      const formatted = formatCharacterSkeletonForPrompt(char);
      context += `- ${formatted}\n`;
    }
    context += `\nCRITICAL: When these characters appear in scenes, use their EXACT names and descriptions above.\n`;
    context += `Do NOT invent new names, do NOT create variations like "Chef" vs "Chef Marco" - use the EXACT name.\n`;
    context += `Do NOT add "No visible characters" as a character - if no character is present, use "none".\n`;
  } else {
    context += `\nNO CHARACTERS IDENTIFIED in Phase 1. If characters appear, describe them as "none" or create new character entries.\n`;
  }

  if (background) {
    context += `\nESTABLISHED BACKGROUND/SETTING:\n${background}\n`;
    context += `Use this setting description as the base environment when describing scenes.\n`;
  }

  context += `=== END ESTABLISHED CHARACTERS & SETTING ===\n`;

  return context;
}

/**
 * Build scene generation request body for Gemini API
 * Supports both script-based batching and direct video time-based batching
 * Phase 2: Can use pre-extracted characters from Phase 1
 */
export function buildScenePrompt(options: {
  videoUrl: string;
  sceneCount: number;
  voiceLang?: VoiceLanguage;
  audio?: AudioSettings;
  continuityContext?: string;
  globalNegativePrompt?: string;
  // Phase 2: Pre-extracted characters from Phase 1
  preExtractedCharacters?: CharacterSkeleton[];
  preExtractedBackground?: string;
  // Phase 0: Cinematic color profile
  cinematicProfile?: CinematicProfile;
  // Media type: image vs video generation
  mediaType?: MediaType;
  // Legacy batch info for script-based batching
  batchInfo?: {
    batchNum: number;
    batchStart: number;
    batchEnd: number;
    batchSceneCount: number;
  };
  // Direct mode: time-based batching info
  directBatchInfo?: DirectBatchInfo;
  // Selfie mode (genuine shot-type toggle)
  selfieMode?: boolean;
}): GeminiRequestBody {
  const {
    videoUrl,
    sceneCount,
    voiceLang = "no-voice",
    audio,
    continuityContext = "",
    globalNegativePrompt,
    preExtractedCharacters,
    preExtractedBackground,
    cinematicProfile,
    mediaType = "video",
    batchInfo,
    directBatchInfo,
    selfieMode,
  } = options;

  // Build system instruction with scene count
  const effectiveSceneCount = directBatchInfo?.sceneCount ?? sceneCount;
  const systemText = SYSTEM_INSTRUCTION.replace(
    /{SceneNumber}/g,
    String(effectiveSceneCount)
  );

  // Build user prompt
  let userPrompt = BASE_USER_PROMPT;

  // Add pre-extracted characters context (Phase 2 - character rules are in SYSTEM_INSTRUCTION)
  if (preExtractedCharacters && preExtractedCharacters.length > 0) {
    userPrompt += buildPreExtractedCharactersContext(preExtractedCharacters, preExtractedBackground);
  }

  // Add cinematic profile context (Phase 0 - takes priority over inferred style)
  if (cinematicProfile) {
    userPrompt += buildCinematicProfileContext(cinematicProfile);
  }

  // Add media type instructions (image vs video generation)
  userPrompt += getMediaTypeInstructions(mediaType);

  // Add selfie mode instructions if enabled (genuine shot-type switch)
  if (selfieMode) {
    userPrompt += "\n" + SELFIE_MODE_INSTRUCTIONS;
  }

  // Add audio instructions: use granular AudioSettings if provided, else fall back to VoiceLanguage
  if (audio) {
    userPrompt = addAudioInstructions(userPrompt, audio);
  } else {
    userPrompt = addVoiceInstructions(userPrompt, voiceLang);
  }

  if (continuityContext) {
    userPrompt += continuityContext;
  }

  // Direct mode: Add time range instruction for video segment analysis
  if (directBatchInfo) {
    userPrompt += `\n\n=== TIME RANGE INSTRUCTION (CRITICAL) ===`;
    userPrompt += `\nANALYZE ONLY the video segment from ${directBatchInfo.startTime} to ${directBatchInfo.endTime}.`;
    userPrompt += `\nBatch ${directBatchInfo.batchNum + 1} of ${directBatchInfo.totalBatches}.`;
    userPrompt += `\nGenerate EXACTLY ${directBatchInfo.sceneCount} scenes for this segment.`;
    if (directBatchInfo.batchNum > 0) {
      userPrompt += `\nThis is a CONTINUATION - maintain character consistency with previous batches.`;
    }
    userPrompt += `\n=== END TIME RANGE INSTRUCTION ===`;
  }

  // Legacy script-based batch info
  if (batchInfo) {
    userPrompt += `\n\nBATCH: Generate scenes ${batchInfo.batchStart}-${batchInfo.batchEnd} (${batchInfo.batchSceneCount} scenes).`;
    if (batchInfo.batchNum > 0) {
      userPrompt += ` Continues from scene ${batchInfo.batchStart - 1}. Maintain continuity.`;
    }
  }

  // Global negative prompt instruction
  if (globalNegativePrompt) {
    userPrompt += `\n\n=== GLOBAL NEGATIVE PROMPT (APPLY TO ALL SCENES) ===`;
    userPrompt += `\n${globalNegativePrompt}`;
    userPrompt += `\nInclude this in EVERY scene's negativePrompt field.`;
    userPrompt += `\nYou MAY add scene-specific exclusions (comma-separated after global).`;
    userPrompt += `\n=== END GLOBAL NEGATIVE PROMPT ===`;
  }

  return {
    contents: [
      {
        parts: [
          {
            fileData: {
              fileUri: videoUrl,
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
      parts: [{ text: systemText }],
      role: "user",
    },
    generationConfig: {
      temperature: 1.0, // Recommended for both Gemini 2.5 and 3 models
      maxOutputTokens: 65536, // Gemini 2.5/3.x maximum output token limit
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
}

// ============================================================================
// STEP 1: URL to Script - System instruction
// ============================================================================

const SCRIPT_SYSTEM_INSTRUCTION = `ROLE: You are an expert video analyst and scriptwriter.

GOAL: Analyze the entire video from START to END and create a detailed script/transcript that captures:
1. All spoken dialogue with speaker identification
2. Visual actions and movements
3. Scene transitions and timing
4. Emotional context and atmosphere
5. Important visual elements and settings

CHARACTER IDENTIFICATION (CRITICAL):
- Assign proper names to all recurring people in the video
- Use context clues (name tags, introductions, credits) when available
- If name unknown, assign role-based names: "Host Alex", "Chef Marco", "Guest Sarah", "Narrator Mike"
- Track each character's distinctive visual features for consistency:
  • Gender, age range, body type
  • Hair: color, length, style
  • Clothing: main outfit details
  • Distinctive features: glasses, beard, accessories
- In the "characters" output array, list each character as: "Name - brief appearance description"
- Example: ["Chef Marco - male, 40s, white coat, salt-pepper hair", "Host Sarah - female, 30s, red blazer, brown hair"]

OUTPUT FORMAT:
- Produce a structured script with timestamped segments
- Each segment should include: timestamp, content, speaker (if applicable), action, emotion
- Include a summary of the video content
- List all identified characters WITH their appearance descriptions
- List all settings/locations seen

TEMPORAL RIGOR:
- Use approximate timestamps in MM:SS format
- Keep ordering strictly chronological
- Mark clear transitions between segments

LANGUAGE:
- Transcribe dialogue in the original language
- Describe actions in English
- Note language switches if any

CRITICAL - IGNORE CAPTION TIMESTAMPS:
- Do NOT include any on-screen caption timestamps (00:00, 01:23, etc.) in the rawText field
- The rawText must contain ONLY the actual dialogue, narration, and action descriptions
- If the video has visible subtitles/captions with timestamps, extract ONLY the text content, not the timing markers
- Timestamps belong ONLY in the segments array's timestamp field, never in rawText`;

const SCRIPT_USER_PROMPT = `Analyze this video and create a detailed script/transcript.

REQUIREMENTS:
1. Transcribe ALL spoken content with speaker identification
2. Describe visual actions between dialogue
3. Note emotional tones and atmosphere
4. Identify all characters by name or description
5. Note all locations/settings
6. Include approximate timestamps

Return ONLY valid JSON according to the schema.`;

const SCRIPT_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "Video title or main topic" },
    duration: { type: "STRING", description: "Video duration in MM:SS format" },
    language: { type: "STRING", description: "Primary language of the video" },
    segments: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          timestamp: { type: "STRING", description: "Timestamp in MM:SS format" },
          content: { type: "STRING", description: "Dialogue or narration text" },
          speaker: { type: "STRING", description: "Who is speaking (if applicable)" },
          action: { type: "STRING", description: "Visual action happening" },
          emotion: { type: "STRING", description: "Emotional tone/context" },
        },
        required: ["timestamp", "content"],
      },
    },
    summary: { type: "STRING", description: "Brief summary of the video content" },
    characters: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of identified characters",
    },
    settings: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of locations/settings",
    },
    rawText: { type: "STRING", description: "Full transcript as plain text. MUST contain ONLY dialogue, narration, and action descriptions. Do NOT include any timestamps, time codes, or caption timing markers (like 00:00, 01:23, etc.) in this field." },
  },
  required: ["title", "duration", "language", "segments", "summary", "characters", "settings", "rawText"],
};

/**
 * Build script generation request for Step 1: URL to Script
 */
export function buildScriptPrompt(options: {
  videoUrl: string;
  startTime?: string;
  endTime?: string;
  videoDescription?: { fullText: string; chapters?: Array<{ timestamp: string; seconds: number; title: string }> };
}): GeminiRequestBody {
  let userPrompt = SCRIPT_USER_PROMPT;
  let systemInstruction = SCRIPT_SYSTEM_INSTRUCTION;

  // Add video chapters to system instruction if available
  if (options.videoDescription?.chapters && options.videoDescription.chapters.length > 0) {
    systemInstruction += `\n\nVIDEO CHAPTERS (from video description):\n`;
    for (const chapter of options.videoDescription.chapters) {
      systemInstruction += `- ${chapter.timestamp} (${chapter.seconds}s): ${chapter.title}\n`;
    }
    systemInstruction += `\nCRITICAL: Use these chapter timestamps to structure your script segments. Ensure all chapter topics are covered in the transcript.`;
  }

  // Add time range instruction if provided
  if (options.startTime || options.endTime) {
    const timeRange = [];
    if (options.startTime) {
      timeRange.push(`from ${options.startTime}`);
    }
    if (options.endTime) {
      timeRange.push(`to ${options.endTime}`);
    }
    userPrompt += `\n\nTIME RANGE: Only analyze the video segment ${timeRange.join(" ")}. Focus on this specific portion of the video and ignore content outside this range.`;
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
      parts: [{ text: systemInstruction }],
      role: "user",
    },
    generationConfig: {
      temperature: 1.0, // Recommended for both Gemini 2.5 and 3 models
      maxOutputTokens: 65536, // Gemini 2.5/3.x maximum output token limit
      responseMimeType: "application/json",
      responseSchema: SCRIPT_RESPONSE_SCHEMA,
    },
  };
}

// ============================================================================
// STEP 2: Script to Scenes - System instruction
// ============================================================================

const SCRIPT_TO_SCENES_SYSTEM = `ROLE: You are an expert film director and visual designer.

SCENE GRANULARITY TARGET (CRITICAL - MUST FOLLOW):
- You MUST produce EXACTLY {SceneNumber} scenes. This is mandatory, not optional.
- If the script content seems insufficient for {SceneNumber} scenes, increase granularity: break down actions into smaller beats, separate dialogue exchanges, create transitional scenes.
- Each ~8 seconds of content = 1 scene. Split aggressively to hit the target.
- Do NOT under-generate. Under-generating is a failure mode.

GOAL: Transform the provided script into detailed visual scene descriptions. For each significant moment or segment in the script, create a scene with:
- Visual description optimized for image/video generation
- Character appearance details
- Style and lighting specifications
- Composition and framing
- Technical details

SCENE SPLITTING STRATEGY (to reach target count):
- Split dialogue into separate scenes per speaker/exchange
- Create establishing shots before action scenes
- Add reaction shots and cutaways
- Include transitional moments (walking, entering, leaving)
- Show before/during/after states of actions
- Split location changes into departure + arrival scenes

CHARACTER CONSISTENCY:
- Maintain consistent character descriptions throughout
- Track character appearances and clothing
- Use the same descriptors when characters reappear

OUTPUT: Return ONLY a JSON ARRAY with EXACTLY {SceneNumber} scenes. Each scene must have all required fields filled with detailed, concrete information.`;

const SCRIPT_TO_SCENES_USER = `Transform this script into EXACTLY {SceneNumber} visual scene descriptions for video generation.

SCRIPT:
{SCRIPT_TEXT}

---

MANDATORY REQUIREMENTS:
1. Generate EXACTLY {SceneNumber} scenes - no more, no less. Count your output.
2. Each scene must have a vivid visual description (2-4 sentences, present tense)
3. Include detailed character appearance if characters are present
4. Specify style, lighting, composition, and technical details
5. Include a synthesized image prompt
6. All descriptions must AVOID any on-screen text, subtitles, captions, or watermarks

SCENE COUNT ENFORCEMENT:
- If you find yourself generating fewer than {SceneNumber} scenes, you MUST increase granularity
- Split dialogue into multiple exchanges
- Add establishing/transitional shots
- Show reactions and cutaways
- Break long actions into sequential beats
- Your output MUST contain exactly {SceneNumber} scene objects in the JSON array`;

/**
 * Build scene generation request for Step 2: Script to Scenes
 * Phase 2: Can use pre-extracted characters from Phase 1
 */
export function buildScriptToScenesPrompt(options: {
  scriptText: string;
  sceneCount: number;
  voiceLang?: VoiceLanguage;
  audio?: AudioSettings;
  globalNegativePrompt?: string;
  // Phase 2: Pre-extracted characters from Phase 1
  preExtractedCharacters?: CharacterSkeleton[];
  preExtractedBackground?: string;
  // Phase 0: Cinematic color profile
  cinematicProfile?: CinematicProfile;
  // Media type: image vs video generation
  mediaType?: MediaType;
  // Selfie mode (genuine shot-type toggle)
  selfieMode?: boolean;
}): GeminiRequestBody {
  const {
    scriptText,
    sceneCount,
    voiceLang = "no-voice",
    audio,
    globalNegativePrompt,
    preExtractedCharacters,
    preExtractedBackground,
    cinematicProfile,
    mediaType = "video",
    selfieMode,
  } = options;

  const systemText = SCRIPT_TO_SCENES_SYSTEM.replace("{SceneNumber}", String(sceneCount));

  let userPrompt = SCRIPT_TO_SCENES_USER
    .replace("{SCRIPT_TEXT}", scriptText)
    .replace("{SceneNumber}", String(sceneCount));

  // Add pre-extracted characters context (Phase 2)
  if (preExtractedCharacters && preExtractedCharacters.length > 0) {
    userPrompt += buildPreExtractedCharactersContext(preExtractedCharacters, preExtractedBackground);
  }

  // Add cinematic profile context (Phase 0)
  if (cinematicProfile) {
    userPrompt += buildCinematicProfileContext(cinematicProfile);
  }

  // Add media type instructions (image vs video generation)
  userPrompt += getMediaTypeInstructions(mediaType);

  // Add selfie mode instructions if enabled (genuine shot-type switch)
  if (selfieMode) {
    userPrompt += "\n" + SELFIE_MODE_INSTRUCTIONS;
  }

  // Add audio instructions: use granular AudioSettings if provided, else fall back to VoiceLanguage
  if (audio) {
    userPrompt = addAudioInstructions(userPrompt, audio);
  } else {
    userPrompt = addVoiceInstructions(userPrompt, voiceLang);
  }

  // Global negative prompt instruction
  if (globalNegativePrompt) {
    userPrompt += `\n\n=== GLOBAL NEGATIVE PROMPT (APPLY TO ALL SCENES) ===`;
    userPrompt += `\n${globalNegativePrompt}`;
    userPrompt += `\nInclude this in EVERY scene's negativePrompt field.`;
    userPrompt += `\nYou MAY add scene-specific exclusions (comma-separated after global).`;
    userPrompt += `\n=== END GLOBAL NEGATIVE PROMPT ===`;
  }

  return {
    contents: [
      {
        parts: [
          {
            text: userPrompt,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemText }],
      role: "user",
    },
    generationConfig: {
      temperature: 1.0, // Recommended for both Gemini 2.5 and 3 models
      maxOutputTokens: 65536, // Gemini 2.5/3.x maximum output token limit
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
}

/**
 * Extract JSON from text that may contain markdown code blocks or other formatting
 */
function extractJsonFromText(text: string): string {
  // Try to extract from markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object or array in the text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // Return original text if no patterns found
  return text.trim();
}

/**
 * Try to repair truncated JSON by closing open brackets
 */
function repairTruncatedJson(text: string): string {
  let repaired = text.trim();

  // Count open and close brackets
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  // If we have more opens than closes, the JSON is likely truncated
  if (openBraces > closeBraces || openBrackets > closeBrackets) {
    // Remove trailing incomplete content (partial string, trailing comma, etc.)
    repaired = repaired
      .replace(/,\s*$/, '') // Remove trailing comma
      .replace(/,\s*"\w*$/, '') // Remove trailing partial key
      .replace(/:\s*"[^"]*$/, ': ""') // Close unclosed string value
      .replace(/:\s*$/, ': null'); // Add null for missing value

    // Add missing closing brackets
    const missingBrackets = closeBrackets - openBrackets;
    const missingBraces = closeBraces - openBraces;

    for (let i = 0; i < Math.abs(missingBrackets); i++) {
      repaired += ']';
    }
    for (let i = 0; i < Math.abs(missingBraces); i++) {
      repaired += '}';
    }
  }

  return repaired;
}

/**
 * Parse script response from Gemini API
 */
export function parseScriptResponse(response: {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
}): GeneratedScript {
  const candidate = response?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No text response from Gemini API");
  }

  // First try direct parse
  try {
    const parsed = JSON.parse(text);
    return normalizeScript(parsed);
  } catch {
    // Try extracting JSON from formatted text
  }

  // Try extracting JSON from markdown/formatted response
  const extracted = extractJsonFromText(text);
  try {
    const parsed = JSON.parse(extracted);
    return normalizeScript(parsed);
  } catch {
    // Try repairing truncated JSON
  }

  // Try to repair truncated JSON
  const repaired = repairTruncatedJson(extracted);
  try {
    const parsed = JSON.parse(repaired);
    return normalizeScript(parsed);
  } catch (parseError) {
    // Provide helpful error with preview of response
    const preview = text.substring(0, 300);
    const errorMsg = parseError instanceof Error ? parseError.message : "Unknown parse error";
    throw new Error(
      `Failed to parse script response as JSON. Error: ${errorMsg}. Response preview: ${preview}${text.length > 300 ? "..." : ""}`
    );
  }
}

/**
 * Normalize script to ensure all required fields exist
 */
function normalizeScript(parsed: Record<string, unknown>): GeneratedScript {
  return {
    title: String(parsed.title || "Untitled"),
    duration: String(parsed.duration || "Unknown"),
    language: String(parsed.language || "Unknown"),
    summary: String(parsed.summary || ""),
    characters: Array.isArray(parsed.characters) ? parsed.characters as string[] : [],
    settings: Array.isArray(parsed.settings) ? parsed.settings as string[] : [],
    segments: Array.isArray(parsed.segments) ? parsed.segments as GeneratedScript["segments"] : [],
    rawText: String(parsed.rawText || parsed.transcript || ""),
  };
}
