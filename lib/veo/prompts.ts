/**
 * VEO Pipeline - Prompt templates for scene generation
 */

import { GeminiRequestBody, VoiceLanguage, GeneratedScript, DirectBatchInfo, CharacterSkeleton, CharacterExtractionResult, CinematicProfile, ColorProfileExtractionResult, StyleObject, MediaType } from "./types";

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
- Name colors descriptively (e.g., "muted teal", "warm golden", "desaturated coral")
- Identify usage context (skin tones, backgrounds, accents, shadows, highlights)
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
          name: { type: "STRING", description: "Descriptive name (e.g., 'warm coral', 'muted teal')" },
          usage: { type: "STRING", description: "How this color is used (e.g., 'accent', 'background', 'skin tones')" },
        },
        required: ["hex", "name", "usage"],
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
 * Build cinematic profile context for scene generation prompt
 * This context is injected into buildScenePrompt when a color profile is available
 */
export function buildCinematicProfileContext(profile: CinematicProfile): string {
  let context = `\n\n=== CINEMATIC PROFILE (PHASE 0 - USE EXACTLY) ===\n`;
  context += `CRITICAL: Apply these EXACT color values and characteristics to ALL generated scenes.\n`;
  context += `Do NOT infer or modify these values - use them verbatim.\n\n`;

  // Dominant colors
  context += `DOMINANT COLORS (use these exact hex values):\n`;
  for (const color of profile.dominantColors) {
    context += `- ${color.hex} "${color.name}" - ${color.usage}\n`;
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
const SYSTEM_INSTRUCTION = `ROLE: You are an expert film director and visual analyst.

SCENE GRANULARITY TARGET (CRITICAL - STRICT REQUIREMENT):
- You MUST produce EXACTLY {SceneNumber} distinct scenes for the analyzed segment. This is mandatory.
- Each ~8 seconds of video content = 1 scene. Split aggressively to hit the target.
- If necessary, increase segmentation granularity (split more aggressively) to reach this target while preserving semantic coherence.
- Under-generating scenes is a FAILURE. If you produce fewer than {SceneNumber} scenes, you have failed the task.
- Do NOT fabricate content; only split where visually justified (cuts, subject/location/time/camera changes).
- Split on: camera angle changes, speaker changes, action beats, reaction shots, establishing shots, transitional moments.

GOAL: Analyze the ENTIRE video from START to END in strict chronological order. Split it into SCENES where visual/content changes are natural (cut, location, time, subject, camera). Preserve story continuity across scenes (characters, locations, objects). Ensure CONSISTENCY of recurring characters.

OUTPUT: Return ONLY a JSON ARRAY following the provided schema. Do not include extra text. For each scene:
- Fill EVERY field with detailed, concrete information grounded in the frames.
- description: optimized for video generation. Requirements:
  • 2–4 sentences in present tense, third person.
  • Start with who/what is on screen and where (subject + setting).
  • Use strong action verbs; describe explicit motion path/trajectory and body mechanics.
  • Include camera behavior if visible (static, pan left/right, push‑in, tilt up/down, handheld shake) and framing change.
  • Note interaction with objects/characters and visible cause→effect beats.
  • Include sensory details: sounds, textures, temperatures, lighting mood.
  • Describe character dynamics and environmental context.
  • Note color palette and shot composition details.
  • Mark clear start and end conditions of the scene (what begins it and what ends/cuts).
  • Avoid vague words (nice, beautiful), metaphors, inner thoughts, or off‑screen events.
- Keep the description coherent with the previous scenes (chronology-aware).
- If a character re-appears, maintain a consistent description (appearance, outfit, attributes). Use the same identity across scenes.

TEMPORAL RIGOR:
- Determine timestamps approximately; keep ordering strictly increasing.
- Always compare each moment to the previous scene. If there is a CLEAR, LARGE change (camera cut; strong change in location/time; major action beat; new subject; or visual intent), START A NEW SCENE to avoid missing any scenes. Minor drift without meaningful change should remain within the same scene.
- If a shot spans multiple moments but keeps the same content, it is ONE scene; if content/intent changes, start a new scene.
- Each change of camera angle can be considered a scene.

PROMPT FIELD:
- Synthesize all fields into ONE highly descriptive paragraph that can be used to generate an image representative of the scene.
- Include style, lighting, composition, technical cues, and the key narrative action.

STYLE CONSISTENCY:
- Populate the 'style' field as a DETAILED OBJECT to minimize variance across generations (low standard deviation). Be explicit and exhaustive. Include: genre, art_movement, medium, palette, color_temperature, contrast, texture, brushwork_or_line, rendering_engine, camera_lens, focal_length, depth_of_field, film_stock_or_profile, grain, noise_reduction, post_processing, composition_style, mood, lighting_style. If unknown, provide best visual estimate from frames.

STYLE UNIFICATION (CRITICAL):
- Determine ONE single canonical style for the ENTIRE video.
- The 'style' object MUST be IDENTICAL across ALL scenes (byte-for-byte the same JSON object).
- Copy the exact same style object from the first scene into every subsequent scene (no tweaks, no variation).
- Do NOT introduce scene-specific style changes. Keep composition and lighting descriptions outside of 'style' if they vary, but the 'style' object itself must stay constant.
 - If later scenes attempt to change 'style', IGNORE those changes and preserve the first scene's style exactly.

CHARACTER FIELD RULES (CRITICAL - MANDATORY):
- MUST start with a proper NAME (real name from context, role-based name like "Chef Marco", or descriptive name like "The Host")
- Format: "Name - appearance tags..." (comma-separated tags after the name)
- NEVER include camera terms in character field (no "closeup", "medium shot", "POV", "from behind", "wide angle")
- Camera info goes ONLY in composition.angle and composition.framing fields
- If character name is unknown, assign one based on role: "The Chef", "Host Alex", "Guest Sarah", "Narrator Mike"

CORRECT CHARACTER FORMAT EXAMPLES:
✓ "Chef Marco - male, 40s, white chef coat, tall, olive skin, black hair, confident posture"
✓ "Elena - female, 30s, red silk dress, shoulder-length brown hair, gold earrings, warm smile"
✓ "The Host - male, 35, athletic build, navy polo shirt, khaki shorts, tan skin, charismatic"
✓ "Sarah Chen - female, 25, petite, black blazer, white blouse, glasses, professional demeanor"

WRONG CHARACTER FORMAT (NEVER DO THIS):
❌ "The chef's closeup hand slicing vegetables" - Camera term + action, not character
❌ "A woman in medium shot wearing red dress" - Camera term in character field
❌ "Close-up of man's face" - Camera term, not character description
❌ "A person" - Too generic, assign a name
❌ "Hand holding knife" - Body part/action, not character

CHARACTER:
- WHENEVER a person/character/creature is present, return a DETAILED 'character' STRING in the format:
  Name - tags..., covering: gender/age, body/build, hair (length, style, texture, color, highlights, bangs/parting), face (eyes shape/color/details, brows, face shape - round/square/oval/heart-shaped/diamond), distinctive traits, clothing (top/bottom/shoes/outerwear with fabric/fit/pattern/details), accessories, and any signature elements. Keep production-grade, comma‑separated, consistent across scenes when the same person reappears. Do NOT return a character_profile object.
- Pay EXTRA ATTENTION to hair and clothing details, facial hair details (beard style, mustache shape, stubble length, sideburns), face shape (round, square, oval, heart-shaped, diamond, etc.), and facial tattoos/body art (location, design, size, color, style) in the 'character' tag.

CHARACTER SKELETON SYSTEM (CRITICAL FOR CONSISTENCY):
When identifying characters across multiple scenes, use this system to maintain consistency:

1. FIRST APPEARANCE - Create FIXED SKELETON:
   Include ALL unchanging physical traits in the 'character' field:
   "Name - gender, age, ethnicity/skin tone, body type, face shape, hair (color+length+style), facial hair, distinctive features, base outfit"

   Example: "Chef Marco - male, 40s, Italian, olive skin, stocky build, square jaw, salt-and-pepper short slicked hair, trimmed goatee, scar on left cheek, white chef coat, black apron"

2. SUBSEQUENT APPEARANCES - Use EXACT SAME SKELETON:
   Copy the EXACT character description from first appearance. Never modify core physical traits.
   Add temporary changes in 'characterVariations' field.

3. SCENE VARIATIONS (for temporary changes):
   Use 'characterVariations' field for things that change per-scene:
   {
     "Chef Marco": {
       "accessories": "wearing blue gloves, holding butcher knife",
       "expression": "focused, concentrating",
       "pose": "leaning over cutting board"
     }
   }

SKELETON RULES:
- Physical traits (hair color, body type, face shape, skin tone, distinctive features) NEVER change
- Outfit changes go in characterVariations.outfit
- Expressions, poses, accessories go in characterVariations
- If unsure about a detail, keep it consistent with first appearance

EMOTIONAL CONTEXT:
- Character mood and expression
- Energy level and confidence
- Social dynamics between characters
- Emotional atmosphere of the scene
- Body language and gestures

ENVIRONMENTAL ANALYSIS:
- Setting type: indoor/outdoor/studio/natural
- Weather conditions if visible
- Time of day indicators
- Cultural elements and social context
- Background activity and atmosphere

CULTURAL ANALYSIS:
- Ethnicity and cultural background (if identifiable)
- Social status indicators
- Fashion trends and style choices
- Cultural symbols or elements
- Generational markers

TECHNICAL ANALYSIS:
- Video quality: resolution, clarity, compression artifacts
- Camera work: stability, focus, exposure
- Lighting conditions: natural/artificial, intensity, direction
- Audio cues (if any): music, dialogue, ambient sounds
- Editing style: cuts, transitions, pacing

CAMERA SHOTS BY DISTANCE:
- Extreme close-up (ECU): eyes, mouth, hands, objects
- Close-up (CU): head and shoulders, face focus
- Medium close-up (MCU): chest up, upper body
- Medium shot (MS): waist up, full upper body
- Medium long shot (MLS): knees up, full figure with space
- Long shot (LS): full body with background
- Extreme long shot (ELS): wide establishing shot, landscape

CAMERA ANGLES:
- Eye-level: neutral, natural perspective
- Low angle: looking up, power/authority
- High angle: looking down, vulnerability
- Bird's eye view: directly overhead, omniscient
- Worm's eye view: extreme low angle, dramatic
- Dutch angle: tilted, disorientation/unease
- Over-the-shoulder: character perspective
- Point-of-view (POV): first-person perspective

CAMERA MOVEMENTS:
- Static: fixed position, no movement
- Pan: horizontal rotation left/right
- Tilt: vertical rotation up/down
- Zoom: lens focal length change (in/out)
- Dolly: camera physically moves forward/backward
- Tracking: camera follows subject laterally
- Handheld: shaky, documentary style
- Crane: vertical camera movement
- Aerial: drone/aircraft shots
- Steadicam: smooth, floating movement
- Whip pan: fast horizontal movement
- Reveal: camera movement that reveals new information

SCENE TRANSITION DETECTION:
- Identify clear cuts vs. continuous shots
- Note location changes and time jumps
- Detect subject changes and new characters
- Recognize camera angle and distance changes
- Identify lighting and mood shifts

STRICTNESS:
- Your answer must be valid JSON according to the schema (no markdown, no comments).
- Prefer objective, visual facts; avoid speculation.
- Uphold character consistency across scenes.

NEGATIVE PROMPT FIELD (CRITICAL):
- The 'negativePrompt' field specifies elements that MUST NOT appear in the generated scene
- ALWAYS include the global negative prompt provided by the user
- You SHOULD add scene-specific exclusions based on context
- Format: comma-separated list

SCENE-SPECIFIC ADDITIONS (Examples):
Visual Context:
  • "children" (for adult-only scenes)
  • "motion blur" (for static establishing shots)
  • "modern elements, smartphones, cars" (for historical period scenes)
  • "daytime, sunlight" (for night scenes)

Continuity Context:
  • "character holding [item]" (if they dropped it in previous scene)
  • "character wearing [outfit]" (if they changed clothes)
  • "background crowd" (if scene transitioned to private area)
  • Pay special attention to object persistence across scenes

Physics/Logic:
  • If an object is dropped/placed, do NOT have it magically reappear in hand
  • If a character exits frame, do NOT have them suddenly back without transition
  • Maintain spatial consistency (if standing, can't be sitting without action)

CRITICAL RULES:
- NEVER contradict the positive description
- Final format: [global exclusions], [scene-specific additions]
- Scene-specific additions should enhance continuity and prevent physics violations`;

/**
 * Character analysis prompt for hybrid mode
 */
export const CHARACTER_ANALYSIS_PROMPT = `
CHARACTER ANALYSIS (CRITICAL - EXTRA DETAILED):
For EVERY person/character visible, provide EXHAUSTIVE details in the 'character' field:

FORMAT: "Name - [all tags comma-separated]"
Example: "Chef Marco - male, 40s, white chef coat, tall build, olive skin, black short hair, confident posture"

WHAT NOT TO DO (CRITICAL - AVOID THESE MISTAKES):
❌ "The man in closeup" - No camera terms in character field!
❌ "A person" - Too generic, must assign a name!
❌ "Hand holding knife" - This is object/action, not character!
❌ "Medium shot of woman" - Camera info goes in composition field!
❌ "Close-up chef slicing" - Camera term + action mixed with character!
❌ "The chef's hand" - Body part, not full character description!

CORRECT FORMAT EXAMPLES:
✓ "Alex Chen - male, 35, athletic build, black short hair, tan skin, navy polo shirt, khaki shorts, confident smile"
✓ "Host Maria - female, 28, petite, long brown hair, olive skin, red blazer, white blouse, warm demeanor"
✓ "Chef Paolo - male, 50s, stocky build, salt-pepper hair, white chef coat, apron, experienced expression"

REQUIRED TAGS:
1. IDENTITY: gender, estimated age range, ethnicity/skin tone
2. BODY: height (tall/medium/short), build (slim/athletic/stocky/heavy), posture
3. FACE SHAPE: oval, round, square, heart, diamond, oblong, rectangle
4. FACIAL FEATURES:
   - Eyes: shape (almond/round/hooded/monolid), color, distinctive features
   - Eyebrows: thick/thin, arched/straight, color
   - Nose: shape (straight/aquiline/button/wide)
   - Lips: full/thin, color
   - Jawline: sharp/soft/rounded
5. HAIR:
   - Length: bald/buzz/short/medium/long/very long
   - Style: straight/wavy/curly/coily, parted/slicked/messy
   - Color: specific shade (jet black, dark brown, chestnut, blonde, gray, white)
   - Texture: fine/thick/coarse
   - Details: bangs, highlights, receding, balding pattern
6. FACIAL HAIR (if any):
   - Type: clean-shaven, stubble, goatee, full beard, mustache
   - Length: 5 o'clock shadow, short, medium, long
   - Style: trimmed, wild, shaped
   - Color: same as hair or different
7. SKIN: tone, texture, visible marks (scars, moles, freckles, wrinkles)
8. CLOTHING (top to bottom):
   - Head: hat, cap, headband, none
   - Top: type, color, pattern, fit, fabric, brand if visible
   - Bottom: type, color, fit, fabric
   - Footwear: type, color, style
   - Outerwear: jacket, coat, vest (with details)
9. ACCESSORIES: glasses, jewelry, watch, bag, tools
10. DISTINCTIVE FEATURES: tattoos, piercings, scars, birthmarks (with location)

CHARACTER CONSISTENCY RULES:
- First appearance defines the CANONICAL description
- Use EXACT same description when character reappears
- Track clothing changes explicitly: "now wearing [new item]"
- Never abbreviate - always use full detailed description
- Camera/shot info NEVER goes in character field - use composition field instead`;

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
=== VIDEO GENERATION MODE (MOTION VIDEO) ===
Generate scenes optimized for VIDEO generation (VEO, Sora, Runway Gen-3).

CRITICAL REQUIREMENTS:
- Each scene represents a 4-8 SECOND VIDEO CLIP
- Describe explicit motion paths and trajectories
- Include camera movement when appropriate (pan, tilt, dolly, etc.)
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

CONTINUITY BETWEEN SCENES:
- Use video.continuity to track scene relationships
- matchAction: true if motion continues from previous scene
- matchColor: true to maintain color grade
- Note any transitions (cut, fade, dissolve)
=== END VIDEO GENERATION MODE ===`;

/**
 * Get media-specific instructions based on mediaType
 */
export function getMediaTypeInstructions(mediaType: "image" | "video" = "video"): string {
  return mediaType === "image" ? IMAGE_GENERATION_INSTRUCTIONS : VIDEO_GENERATION_INSTRUCTIONS;
}

// ============================================================================
// VEO 3 PROMPTING GUIDE - Advanced Instructions
// ============================================================================

/**
 * VEO 3 Audio System Instructions
 * Prevents audio hallucinations and enables precise sound design
 */
export const VEO3_AUDIO_INSTRUCTIONS = `
=== VEO 3 AUDIO SYSTEM ===
AUDIO DESIGN (CRITICAL for preventing hallucinations):

1. ENVIRONMENTAL AUDIO - Specify location-appropriate ambient sounds:
   - Kitchen: "sizzling pan, knife chopping, boiling water, kitchen ambiance"
   - Forest: "birds chirping, leaves rustling, gentle wind, natural ambiance"
   - Office: "keyboard typing, air conditioning hum, paper rustling, professional atmosphere"
   - City Street: "traffic noise, distant horns, footsteps on pavement, urban ambiance"

2. MUSIC SPECIFICATION - Use structured music descriptions:
   - Format: "[mood] [genre] [instruments], [tempo/energy]"
   - Example: "Uplifting orchestral music with strings, building to inspiring crescendo"
   - Volume levels: "background" (subtle), "prominent" (clear), "featured" (primary)

3. SOUND EFFECTS - Always name exact sounds with triggers:
   - Format: "[sound] as/when [trigger]"
   - Example: "Footsteps on gravel as character walks"
   - Example: "Door slamming shut, echoing in hallway"

4. AUDIO HALLUCINATION PREVENTION (CRITICAL):
   - ALWAYS specify what SHOULD be heard
   - EXPLICITLY name what should NOT be heard
   - Add negations: "No unwanted laughter, no applause, no crowd noise"
   - Include room tone: "professional atmosphere", "natural room tone"

OUTPUT: Populate the 'audio' field with:
- environmental: {ambiance, intensity, spatialPosition}
- music: {mood, genre, volume}
- soundEffects: [{sound, trigger}]
- negations: ["unwanted sounds to prevent"]
=== END VEO 3 AUDIO SYSTEM ===`;

/**
 * VEO 3 Dialogue System Instructions
 * Uses colon format to prevent subtitles
 */
export const VEO3_DIALOGUE_INSTRUCTIONS = `
=== VEO 3 DIALOGUE SYSTEM ===
DIALOGUE FORMATTING (CRITICAL for subtitle prevention):

1. THE COLON RULE (Prevents subtitles):
   ✅ CORRECT: "[Character] [action] and says: '[dialogue]' [tone]"
   ❌ WRONG: "[Character] says '[dialogue]'" (triggers subtitles)

   Example: "Chef Marco turns to camera and says: 'The secret is in the freshness.' with warm, passionate enthusiasm"

2. THE 8-SECOND RULE (MANDATORY):
   - Maximum: 12-15 words per line
   - Maximum: 20-25 syllables per line
   - This ensures dialogue fits within scene duration

3. PHONETIC SPELLING (For mispronunciation fixes):
   - Use phonetic versions for unusual names
   - Example: "foh-fur's" instead of "Fofur's"

4. SPECIFY TONE/DELIVERY:
   - Add emotional delivery: "with conviction", "whispered softly", "shouted angrily"
   - Include body language cues: "leaning forward", "eyes narrowing"

5. MULTIPLE SPEAKERS:
   - Name each character explicitly before their line
   - Separate speakers with clear transitions

OUTPUT: Populate the 'dialogue' array with:
- character: Character name
- line: The dialogue text (max 12-15 words)
- delivery: Tone/manner of speaking
- phonetic: Phonetic spelling if needed
- emotion: Emotional state
=== END VEO 3 DIALOGUE SYSTEM ===`;

/**
 * VEO 3 Camera Positioning Instructions
 * Uses "(thats where the camera is)" syntax for precise positioning
 */
export const VEO3_CAMERA_INSTRUCTIONS = `
=== VEO 3 CAMERA POSITIONING ===
CAMERA POSITION SYNTAX (CRITICAL breakthrough for precise positioning):

1. THE KEY PHRASE: "(thats where the camera is)"
   This phrase triggers camera-aware processing in Veo 3.

   Format: "[Shot type] with camera positioned at [location] (thats where the camera is)"

2. EXAMPLES:
   - "Close-up shot with camera positioned at counter level (thats where the camera is)"
   - "POV shot from camera at eye level (thats where the camera is) as character explains"
   - "Over-shoulder view, camera behind interviewer (thats where the camera is)"
   - "Low angle shot, camera on ground looking up (thats where the camera is)"
   - "Aerial view, camera positioned directly overhead (thats where the camera is)"

3. CAMERA HEIGHT OPTIONS:
   - ground-level: Dramatic low perspective
   - eye-level: Natural, neutral view
   - overhead: Looking down on subject
   - aerial: High drone-style shot

4. CAMERA DISTANCE OPTIONS:
   - intimate: Extreme close-up, personal
   - close: Head and shoulders
   - medium: Waist up
   - far: Full body with environment
   - extreme: Wide establishing shot

5. MOVEMENT QUALITY KEYWORDS:
   - "natural movement" - Default, realistic motion
   - "fluid movement" - Smooth, continuous
   - "energetic movement" - Dynamic, high-energy
   - "deliberate movement" - Thoughtful, careful
   - "graceful movement" - Smooth, flowing

OUTPUT: Populate 'enhancedCamera' with position details and include
positionPhrase containing "(thats where the camera is)" syntax.
=== END VEO 3 CAMERA POSITIONING ===`;

/**
 * VEO 3 Expression Control Instructions
 * Anti-model-face technique for natural expressions
 */
export const VEO3_EXPRESSION_INSTRUCTIONS = `
=== VEO 3 EXPRESSION CONTROL ===
EXPRESSION DESIGN (Anti-model-face technique):

1. MICRO-EXPRESSIONS (Eliminate flat "model face"):
   - "Eyes squint thoughtfully, head tilts as if processing"
   - "Furrow between brows deepens, momentary pause before speaking"
   - "Small step forward, chin raised slightly, eyes focused and direct"

2. EYE MOVEMENT:
   Direction meanings:
   - up: Thinking, remembering
   - down: Sad, submissive, ashamed
   - left/right: Considering, processing
   - camera: Direct address, connection
   - away: Avoiding, uncomfortable

   Behavior keywords:
   - narrow: Suspicious, focused
   - squint: Thinking, sun in eyes
   - wide: Surprise, fear, excitement
   - darting: Nervous, searching
   - focused: Determined, intent

3. BODY LANGUAGE:
   Posture meanings:
   - upright: Confident, alert
   - slouched: Defeated, tired, casual
   - leaning: Interested, engaged
   - rigid: Tense, uncomfortable
   - relaxed: At ease, comfortable

4. EMOTIONAL ARC ("This Then That" progression):
   Structure emotion progression within scene:
   - Start state: "confused and uncertain"
   - Transition: "gradually becoming confident"
   - End state: "satisfied smile of accomplishment"

5. ANTI-MODEL-FACE TECHNIQUE:
   Add natural imperfection:
   "Natural, unstaged expression with slight asymmetry, avoiding perfect model pose, authentic human moment"

OUTPUT: Populate 'expressionControl' and 'emotionalArc' fields.
=== END VEO 3 EXPRESSION CONTROL ===`;

/**
 * VEO 3 Advanced Composition Instructions
 * Lens effects, color grading, professional lighting
 */
export const VEO3_COMPOSITION_INSTRUCTIONS = `
=== VEO 3 ADVANCED COMPOSITION ===
PROFESSIONAL COMPOSITION ELEMENTS:

1. LENS EFFECTS:
   - Depth of Field: "shallow" (isolates subject), "deep" (everything sharp)
   - Aperture feel: "f/1.4 creamy bokeh", "f/2.8 smooth background"
   - Lens types: standard, wide-angle, telephoto, macro, anamorphic
   - Lens flare: "anamorphic horizontal streaks", "natural sun flare"

2. COLOR GRADING:
   Palette types:
   - teal-orange: Hollywood blockbuster look
   - desaturated: Serious, dramatic tone
   - warm-orange: Comfort, intimacy
   - cool-blue: Modern, tech, mysterious
   - noir: Black and white classic

   Split-toning syntax:
   "Split-toning with shadows pushed toward blue (#1a3a5c) and highlights toward warm amber (#d4a574)"

3. PROFESSIONAL LIGHTING SETUPS:
   - three-point: "Warm key light from left, fill softening shadows, rim lighting separating subject"
   - rembrandt: "Triangle of light on cheek, dramatic portrait lighting"
   - golden-hour: "Warm, nostalgic atmospheric light through windows, long shadows"
   - chiaroscuro: "Stark contrasts, film noir dramatic shadows, single light source"
   - neon: "Vibrant magenta/cyan reflecting off wet surfaces, cyberpunk aesthetic"

4. COMPOSITION RULES:
   - rule-of-thirds: "Subject at left third intersection point"
   - leading-lines: "Drawing eye from foreground to subject"
   - frame-within-frame: "Using doorway to focus attention"
   - symmetry: "Formal, balanced aesthetic"
   - negative-space: "Isolating subject with empty space"

OUTPUT: Populate 'lensEffects', 'colorGrading', 'advancedLighting', 'advancedComposition' fields.
=== END VEO 3 ADVANCED COMPOSITION ===`;

/**
 * VEO 3 Physics-Aware Prompting Instructions
 */
export const VEO3_PHYSICS_INSTRUCTIONS = `
=== VEO 3 PHYSICS-AWARE PROMPTING ===
REALISTIC PHYSICS KEYWORDS:

1. GENERAL PHYSICS:
   - "realistic physics governing all actions"
   - "natural fluid dynamics"
   - "authentic momentum conservation"
   - "proper weight and balance"
   - "realistic material behavior"

2. MATERIAL BEHAVIOR:
   Fabric: "flowing", "stiff", "billowing"
   Hair: "static", "windswept", "bouncing"
   Liquid: "splashing", "dripping", "pouring"
   Smoke: "rising wisps", "dispersing naturally"

3. GRAVITY OPTIONS:
   - normal: Standard Earth gravity
   - low: Slow-motion floating effect
   - zero: Weightless environment
   - heavy: Exaggerated weight

OUTPUT: Populate 'physicsAwareness' field with enabled constraints.
=== END VEO 3 PHYSICS-AWARE PROMPTING ===`;

/**
 * VEO 3 Selfie/POV Mode Instructions
 */
export const VEO3_SELFIE_INSTRUCTIONS = `
=== VEO 3 SELFIE/POV MODE ===
PROVEN SELFIE FORMULA:

"A selfie video of [CHARACTER] [ACTIVITY].
[He/She] holds camera at arm's length.
[His/Her] arm is clearly visible in frame.
Occasionally looking into camera before [SPECIFIC_ACTION].
The image is slightly grainy, looks very film-like.
[He/She] says: '[DIALOGUE]' [TONE].
Ends with [GESTURE]."

CRITICAL ELEMENTS:
1. Start phrase: "A selfie video of..."
2. Arm visibility: "arm is clearly visible in the frame"
3. Natural eye contact: "occasionally looking into the camera before..."
4. Film-like quality: "slightly grainy, looks very film-like"
5. Closing gesture: thumbs up, wave, smile, etc.

CAMERA SHAKE OPTIONS:
- none: Perfectly stable (less authentic)
- subtle: Slight natural movement
- natural: Authentic handheld feel

OUTPUT: Populate 'selfieSpec' field when selfie mode is enabled.
=== END VEO 3 SELFIE/POV MODE ===`;

/**
 * VEO 3 Quality Checklist Instructions
 */
export const VEO3_QUALITY_CHECKLIST = `
=== VEO 3 PRE-GENERATION QUALITY CHECKLIST ===
10-POINT VALIDATION SYSTEM:

□ 1. CHARACTER DESCRIPTION: 15+ specific physical attributes
□ 2. SCENE DETAILS: 10+ environmental elements
□ 3. CAMERA SPECS: Shot type, angle, movement defined
□ 4. LIGHTING: Professional setup specified
□ 5. AUDIO DESIGN: Hallucination prevention (explicit sounds)
□ 6. DIALOGUE: Colon format + tone + 8-second rule
□ 7. NEGATIVE PROMPTS: Comprehensive exclusions
□ 8. TECHNICAL SPECS: Broadcast quality settings
□ 9. BRAND COMPLIANCE: (if applicable)
□ 10. DURATION: Optimized for 8-second format

QUALITY LEVELS:
- Master (8-10 items): 95%+ generation success
- Professional (6-8 items): 85%+ generation success
- Intermediate (4-6 items): 70%+ generation success
- Basic (1-3 items): Poor results

TARGET: Master level for all commercial content.
=== END VEO 3 QUALITY CHECKLIST ===`;

/**
 * Build VEO 3 enhanced instructions based on options
 */
export function buildVeo3Instructions(options: {
  enableAudio?: boolean;
  enableDialogue?: boolean;
  enableCameraPositioning?: boolean;
  enableExpressionControl?: boolean;
  enableAdvancedComposition?: boolean;
  enablePhysics?: boolean;
  selfieMode?: boolean;
  enableQualityChecklist?: boolean;
}): string {
  let instructions = "";

  if (options.enableAudio) {
    instructions += VEO3_AUDIO_INSTRUCTIONS + "\n";
  }

  if (options.enableDialogue) {
    instructions += VEO3_DIALOGUE_INSTRUCTIONS + "\n";
  }

  if (options.enableCameraPositioning) {
    instructions += VEO3_CAMERA_INSTRUCTIONS + "\n";
  }

  if (options.enableExpressionControl) {
    instructions += VEO3_EXPRESSION_INSTRUCTIONS + "\n";
  }

  if (options.enableAdvancedComposition) {
    instructions += VEO3_COMPOSITION_INSTRUCTIONS + "\n";
  }

  if (options.enablePhysics) {
    instructions += VEO3_PHYSICS_INSTRUCTIONS + "\n";
  }

  if (options.selfieMode) {
    instructions += VEO3_SELFIE_INSTRUCTIONS + "\n";
  }

  if (options.enableQualityChecklist) {
    instructions += VEO3_QUALITY_CHECKLIST + "\n";
  }

  return instructions;
}

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
      object: { type: "STRING", description: "Main objects visible in scene (not people)" },
      character: { type: "STRING", description: "Format: 'Name - appearance tags'. MUST start with name (e.g., 'Chef Marco - male, 40s, white coat...'). NEVER include camera terms like closeup, medium shot, POV here." },
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
      visual_specs: {
        type: "OBJECT",
        properties: {
          primary_subject: { type: "STRING" },
          environment: { type: "STRING" },
          key_details: { type: "STRING" },
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
      technical: {
        type: "OBJECT",
        properties: {
          quality: { type: "STRING" },
          colors: { type: "STRING" },
        },
      },
      prompt: { type: "STRING" },
      negativePrompt: {
        type: "STRING",
        description: "Comma-separated unwanted elements. Include global + scene-specific additions.",
      },
      characterVariations: {
        type: "STRING",
        description: "JSON string of per-scene character variations. Format: {\"CharacterName\": {\"accessories\": \"...\", \"expression\": \"...\", \"pose\": \"...\", \"outfit\": \"...\"}}. Use for temporary changes like accessories, expressions, poses, or outfit changes.",
      },
      // Video-specific fields (only populated when mediaType is "video")
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
          audioCues: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Audio cues for the scene (e.g., 'fire crackling', 'knife on wood')",
          },
        },
      },
      // VEO 3 Audio System
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
      // VEO 3 Dialogue System
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
      // VEO 3 Enhanced Camera
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
      // VEO 3 Expression Control
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
      // VEO 3 Emotional Arc
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
      // VEO 3 Advanced Composition
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
      // VEO 3 Shot Size
      shotSize: { type: "STRING", description: "Shot size hierarchy: EWS, WS, MWS, MS, MCU, CU, ECU" },
      // VEO 3 Movement Quality
      movementQuality: { type: "STRING", description: "Movement quality: natural, fluid, graceful, energetic, deliberate" },
    },
    required: [
      "description",
      "object",
      "character",
      "style",
      "visual_specs",
      "lighting",
      "composition",
      "technical",
      "prompt",
    ],
  },
};

/**
 * Add voice instructions to user prompt
 */
export function addVoiceInstructions(
  prompt: string,
  voiceLang: VoiceLanguage
): string {
  if (voiceLang === "no-voice") {
    return (
      prompt +
      `\n\nVOICE INSTRUCTION: Generate scenes for SILENT video with NO voice, NO narration, NO dialogue. Music/ambient sounds only.`
    );
  }
  return (
    prompt +
    `\n\nVOICE INSTRUCTION: Include ${voiceLang.toUpperCase()} voice narration. Add "voice" field with narration text, dialogue, and tone.`
  );
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
 */
function extractActions(scenes: Array<{ description: string }>): string[] {
  const actions = new Set<string>();
  scenes.forEach((scene) => {
    // Extract key action words (simple heuristic: look for verbs)
    const desc = scene.description.toLowerCase();
    const actionWords = [
      "cooking", "preparing", "mixing", "chopping", "grilling", "serving",
      "walking", "talking", "presenting", "demonstrating", "explaining",
      "tasting", "stirring", "pouring", "cutting", "slicing", "baking"
    ];
    actionWords.forEach((word) => {
      if (desc.includes(word)) {
        actions.add(word);
      }
    });
  });
  return Array.from(actions);
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
  // Use summary mode if we have more than 10 scenes
  const useSummary = summaryMode || previousScenes.length > 10;

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
  includeCharacterAnalysis?: boolean;
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
}): GeminiRequestBody {
  const {
    videoUrl,
    sceneCount,
    voiceLang = "no-voice",
    includeCharacterAnalysis = false,
    continuityContext = "",
    globalNegativePrompt,
    preExtractedCharacters,
    preExtractedBackground,
    cinematicProfile,
    mediaType = "video",
    batchInfo,
    directBatchInfo,
  } = options;

  // Build system instruction with scene count
  const effectiveSceneCount = directBatchInfo?.sceneCount ?? sceneCount;
  const systemText = SYSTEM_INSTRUCTION.replace(
    /{SceneNumber}/g,
    String(effectiveSceneCount)
  );

  // Build user prompt
  let userPrompt = BASE_USER_PROMPT;

  // Add pre-extracted characters context (Phase 2 - takes priority over character analysis)
  if (preExtractedCharacters && preExtractedCharacters.length > 0) {
    userPrompt += buildPreExtractedCharactersContext(preExtractedCharacters, preExtractedBackground);
  } else if (includeCharacterAnalysis) {
    // Fallback: Use inline character analysis if no pre-extracted characters
    userPrompt += CHARACTER_ANALYSIS_PROMPT;
  }

  // Add cinematic profile context (Phase 0 - takes priority over inferred style)
  if (cinematicProfile) {
    userPrompt += buildCinematicProfileContext(cinematicProfile);
  }

  // Add media type instructions (image vs video generation)
  userPrompt += getMediaTypeInstructions(mediaType);

  userPrompt = addVoiceInstructions(userPrompt, voiceLang);

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
  globalNegativePrompt?: string;
  // Phase 2: Pre-extracted characters from Phase 1
  preExtractedCharacters?: CharacterSkeleton[];
  preExtractedBackground?: string;
  // Phase 0: Cinematic color profile
  cinematicProfile?: CinematicProfile;
  // Media type: image vs video generation
  mediaType?: MediaType;
}): GeminiRequestBody {
  const {
    scriptText,
    sceneCount,
    voiceLang = "no-voice",
    globalNegativePrompt,
    preExtractedCharacters,
    preExtractedBackground,
    cinematicProfile,
    mediaType = "video",
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

  userPrompt = addVoiceInstructions(userPrompt, voiceLang);

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
