/**
 * Prompt Pipeline - Phase 0: Color profile extraction & combined video analysis
 */

import {
  GeminiRequestBody,
  CharacterSkeleton,
  CinematicProfile,
  ColorProfileExtractionResult,
  VideoAnalysisResult,
  StyleObject,
} from "../types";
import { extractJsonFromText } from "./shared";

// ============================================================================
// PHASE 0: Cinematic Color Profile Extraction
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
 */
export function buildColorProfileExtractionPrompt(options: {
  videoUrl: string;
  startTime?: string;
  endTime?: string;
}): GeminiRequestBody {
  let userPrompt = COLOR_PROFILE_EXTRACTION_USER;

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
export function normalizeColorProfile(parsed: Record<string, unknown>): ColorProfileExtractionResult {
  const dominantColors: CinematicProfile["dominantColors"] = [];
  if (Array.isArray(parsed.dominantColors)) {
    for (const color of parsed.dominantColors) {
      if (typeof color === "object" && color !== null) {
        const colorObj = color as Record<string, unknown>;
        dominantColors.push({
          hex: String(colorObj.hex || "#000000"),
          name: String(colorObj.name || "unknown"),
          usage: String(colorObj.usage || "general"),
          semanticName: String(colorObj.name || "unknown"),
          moods: Array.isArray(colorObj.moods) ? (colorObj.moods as string[]) : [],
          temperature: "neutral",
          psychologyNotes: undefined,
          confidence: undefined,
        });
      }
    }
  }

  const tempObj = (parsed.colorTemperature || {}) as Record<string, unknown>;
  const colorTemperature: CinematicProfile["colorTemperature"] = {
    category: (tempObj.category as "warm" | "cool" | "neutral" | "mixed") || "neutral",
    kelvinEstimate: Number(tempObj.kelvinEstimate) || 5600,
    description: String(tempObj.description || ""),
  };

  const contrastObj = (parsed.contrast || {}) as Record<string, unknown>;
  const contrast: CinematicProfile["contrast"] = {
    level: (contrastObj.level as "low" | "medium" | "high" | "extreme") || "medium",
    style: String(contrastObj.style || ""),
    blackPoint: String(contrastObj.blackPoint || ""),
    whitePoint: String(contrastObj.whitePoint || ""),
  };

  const shadowsObj = (parsed.shadows || {}) as Record<string, unknown>;
  const shadows: CinematicProfile["shadows"] = {
    color: String(shadowsObj.color || "neutral"),
    density: String(shadowsObj.density || "medium"),
    falloff: String(shadowsObj.falloff || "gradual"),
  };

  const highlightsObj = (parsed.highlights || {}) as Record<string, unknown>;
  const highlights: CinematicProfile["highlights"] = {
    color: String(highlightsObj.color || "neutral"),
    handling: String(highlightsObj.handling || "soft roll-off"),
    bloom: Boolean(highlightsObj.bloom),
  };

  const filmObj = (parsed.filmStock || {}) as Record<string, unknown>;
  const filmStock: CinematicProfile["filmStock"] = {
    suggested: String(filmObj.suggested || "digital"),
    characteristics: String(filmObj.characteristics || ""),
    digitalProfile: filmObj.digitalProfile ? String(filmObj.digitalProfile) : undefined,
  };

  const moodObj = (parsed.mood || {}) as Record<string, unknown>;
  const mood: CinematicProfile["mood"] = {
    primary: String(moodObj.primary || ""),
    atmosphere: String(moodObj.atmosphere || ""),
    emotionalTone: String(moodObj.emotionalTone || ""),
  };

  const grainObj = (parsed.grain || {}) as Record<string, unknown>;
  const grain: CinematicProfile["grain"] = {
    amount: (grainObj.amount as "none" | "subtle" | "moderate" | "heavy") || "none",
    type: String(grainObj.type || ""),
    pattern: String(grainObj.pattern || ""),
  };

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
 */
export async function enrichExtractedProfile(
  rawProfile: CinematicProfile
): Promise<CinematicProfile> {
  const { enrichColorEntry, hasGoodSemanticName, hasGoodMoods } = await import('../colorMapper');

  const enrichedColors = rawProfile.dominantColors.map(color => {
    const hasGoodName = hasGoodSemanticName(color.semanticName);
    const hasMoods = hasGoodMoods(color.moods);

    if (hasGoodName && hasMoods) {
      return color;
    }

    return enrichColorEntry(color);
  });

  return { ...rawProfile, dominantColors: enrichedColors };
}

/**
 * Build cinematic profile context for scene generation prompt
 */
export function buildCinematicProfileContext(profile: CinematicProfile): string {
  let context = `\n\n=== CINEMATIC PROFILE (PHASE 0 - USE EXACTLY) ===\n`;
  context += `CRITICAL: Apply these EXACT color values and characteristics to ALL generated scenes.\n`;
  context += `Do NOT infer or modify these values - use them verbatim.\n\n`;

  const { buildSemanticColorDescription } = require('../colorMapper');

  context += `DOMINANT COLORS (apply these exact color characteristics):\n`;
  for (const color of profile.dominantColors) {
    const semanticDesc = buildSemanticColorDescription(color, true);
    context += `- ${semanticDesc} - ${color.usage}\n`;

    if (process.env.NODE_ENV === 'development') {
      context += `  [Technical reference: ${color.hex}]\n`;
    }
  }

  context += `\nCOLOR TEMPERATURE:\n`;
  context += `- Category: ${profile.colorTemperature.category}\n`;
  context += `- Kelvin: ${profile.colorTemperature.kelvinEstimate}K\n`;
  context += `- ${profile.colorTemperature.description}\n`;

  context += `\nCONTRAST:\n`;
  context += `- Level: ${profile.contrast.level}\n`;
  context += `- Style: ${profile.contrast.style}\n`;
  context += `- Black point: ${profile.contrast.blackPoint}\n`;
  context += `- White point: ${profile.contrast.whitePoint}\n`;

  context += `\nSHADOWS: ${profile.shadows.color}, ${profile.shadows.density} density, ${profile.shadows.falloff} falloff\n`;
  context += `HIGHLIGHTS: ${profile.highlights.color}, ${profile.highlights.handling}${profile.highlights.bloom ? ", with bloom" : ""}\n`;

  context += `\nFILM STOCK REFERENCE:\n`;
  context += `- Suggested: ${profile.filmStock.suggested}\n`;
  context += `- Characteristics: ${profile.filmStock.characteristics}\n`;
  if (profile.filmStock.digitalProfile) {
    context += `- Digital profile: ${profile.filmStock.digitalProfile}\n`;
  }

  context += `\nMOOD:\n`;
  context += `- Primary: ${profile.mood.primary}\n`;
  context += `- Atmosphere: ${profile.mood.atmosphere}\n`;
  context += `- Emotional tone: ${profile.mood.emotionalTone}\n`;

  context += `\nGRAIN: ${profile.grain.amount}`;
  if (profile.grain.amount !== "none") {
    context += ` - ${profile.grain.type}, ${profile.grain.pattern}`;
  }
  context += `\n`;

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
 */
export function cinematicProfileToStyleFields(profile: CinematicProfile): Partial<StyleObject> {
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
// COMBINED VIDEO ANALYSIS (Phase 0 + Phase 1 merged)
// ============================================================================

const VIDEO_ANALYSIS_SYSTEM = `ROLE: You are an expert cinematographer, colorist, and character analyst for video production.

GOAL: Watch the ENTIRE video and extract TWO things in a single pass:
1. CINEMATIC COLOR PROFILE - for maintaining visual consistency
2. CHARACTER IDENTIFICATION - all distinct people with detailed attributes

=== PART 1: CINEMATIC COLOR PROFILE ===

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

COLOR IDENTIFICATION RULES:
- Extract EXACT hex color values where possible
- Name colors cinematically with rich mood context:
  * Examples: "deep ocean mystery blue", "golden hour amber", "vintage warm coral"
- Identify emotional associations (mysterious, warm, nostalgic, clinical, energetic)
- Specify usage context (skin tones, backgrounds, accents, shadows, highlights)

=== PART 2: CHARACTER IDENTIFICATION ===

Identify ALL distinct characters/people visible in the video.

CHARACTER IDENTIFICATION RULES (CRITICAL):
- Identify EVERY distinct person who appears in the video
- Assign consistent, specific names (NOT generic like "Chef" then "Chef Marco" - pick ONE name)
- For named characters (if name is mentioned/shown): use that exact name
- For unnamed characters: assign descriptive names based on role: "The Host", "Guest Sarah"
- Include timestamps of first appearance for each character

WHAT TO INCLUDE FOR EACH CHARACTER:
- name: Consistent identifier used throughout
- gender: male/female/non-binary
- age: estimated range (e.g., "40s", "mid-30s")
- ethnicity: Skin tone and cultural appearance
- bodyType: height and build description
- faceShape: face shape description
- hair: color, length, style, texture
- facialHair: beard, mustache, stubble, or clean-shaven
- distinctiveFeatures: scars, tattoos, glasses, piercings
- baseOutfit: primary/default clothing worn
- firstAppearance: timestamp when character first appears

BACKGROUND DESCRIPTION:
- Describe the main environment/setting where most action takes place
- Include: location type, key elements, lighting mood, color palette

=== OUTPUT ===
Return ONLY valid JSON according to the schema with both colorProfile and characters data.`;

const VIDEO_ANALYSIS_USER = `Analyze this entire video and extract:

1. CINEMATIC COLOR PROFILE:
   - 5-8 dominant colors with exact hex values
   - Color temperature, contrast, shadows, highlights
   - Film stock suggestion and mood analysis
   - Grain and post-processing characteristics

2. ALL CHARACTERS:
   - Every person who appears on screen
   - Detailed physical descriptions that remain constant
   - Consistent naming throughout
   - Timestamp of first appearance

3. BACKGROUND/ENVIRONMENT:
   - Main setting description with key visual elements

Return ONLY valid JSON according to the schema.`;

const VIDEO_ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    dominantColors: {
      type: "ARRAY",
      description: "5-8 dominant colors defining the video palette",
      items: {
        type: "OBJECT",
        properties: {
          hex: { type: "STRING", description: "Hex color value (e.g., '#FF5733')" },
          name: { type: "STRING", description: "Cinematic color name with mood context" },
          moods: {
            type: "ARRAY",
            description: "Mood/emotion tags",
            items: { type: "STRING" }
          },
          usage: { type: "STRING", description: "How this color is used" },
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
        style: { type: "STRING", description: "Contrast style" },
        blackPoint: { type: "STRING", description: "Black point characteristics" },
        whitePoint: { type: "STRING", description: "White point characteristics" },
      },
      required: ["level", "style", "blackPoint", "whitePoint"],
    },
    shadows: {
      type: "OBJECT",
      properties: {
        color: { type: "STRING", description: "Shadow color cast" },
        density: { type: "STRING", description: "Shadow density" },
        falloff: { type: "STRING", description: "Shadow falloff" },
      },
      required: ["color", "density", "falloff"],
    },
    highlights: {
      type: "OBJECT",
      properties: {
        color: { type: "STRING", description: "Highlight color cast" },
        handling: { type: "STRING", description: "How highlights are handled" },
        bloom: { type: "BOOLEAN", description: "Whether bloom is present" },
      },
      required: ["color", "handling", "bloom"],
    },
    filmStock: {
      type: "OBJECT",
      properties: {
        suggested: { type: "STRING", description: "Suggested matching film stock" },
        characteristics: { type: "STRING", description: "Key characteristics" },
        digitalProfile: { type: "STRING", description: "Alternative digital color profile" },
      },
      required: ["suggested", "characteristics"],
    },
    mood: {
      type: "OBJECT",
      properties: {
        primary: { type: "STRING", description: "Primary mood" },
        atmosphere: { type: "STRING", description: "Overall atmosphere" },
        emotionalTone: { type: "STRING", description: "Emotional tone conveyed by colors" },
      },
      required: ["primary", "atmosphere", "emotionalTone"],
    },
    grain: {
      type: "OBJECT",
      properties: {
        amount: { type: "STRING", description: "none, subtle, moderate, or heavy" },
        type: { type: "STRING", description: "Type of grain" },
        pattern: { type: "STRING", description: "Grain pattern" },
      },
      required: ["amount", "type", "pattern"],
    },
    postProcessing: {
      type: "OBJECT",
      properties: {
        colorGrade: { type: "STRING", description: "Overall color grade style" },
        saturation: { type: "STRING", description: "Saturation level" },
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
      description: "Confidence level of the color analysis (0.0 to 1.0)",
    },
    characters: {
      type: "ARRAY",
      description: "All distinct characters identified in the video",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Consistent character name" },
          gender: { type: "STRING", description: "male/female/non-binary" },
          age: { type: "STRING", description: "Estimated age range" },
          ethnicity: { type: "STRING", description: "Skin tone and cultural appearance" },
          bodyType: { type: "STRING", description: "Height and build" },
          faceShape: { type: "STRING", description: "Face shape" },
          hair: { type: "STRING", description: "Hair color, length, style, texture" },
          facialHair: { type: "STRING", description: "Beard, mustache, stubble, or clean-shaven" },
          distinctiveFeatures: { type: "STRING", description: "Scars, tattoos, glasses, piercings, etc." },
          baseOutfit: { type: "STRING", description: "Primary clothing worn" },
          firstAppearance: { type: "STRING", description: "Timestamp of first appearance" },
        },
        required: ["name", "gender", "baseOutfit"],
      },
    },
    background: {
      type: "STRING",
      description: "Main environment/setting description",
    },
  },
  required: ["dominantColors", "colorTemperature", "contrast", "shadows", "highlights", "filmStock", "mood", "grain", "postProcessing", "characters", "background"],
};

/**
 * Build combined video analysis request (Phase 0 + Phase 1 merged)
 */
export function buildVideoAnalysisPrompt(options: {
  videoUrl: string;
  startTime?: string;
  endTime?: string;
}): GeminiRequestBody {
  let userPrompt = VIDEO_ANALYSIS_USER;

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
      parts: [{ text: VIDEO_ANALYSIS_SYSTEM }],
    },
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: VIDEO_ANALYSIS_SCHEMA,
    },
  };
}

/**
 * Parse combined video analysis response from Gemini API
 */
export function parseVideoAnalysisResponse(response: {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
}): VideoAnalysisResult {
  const candidate = response?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No text response from Gemini API for video analysis");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    const extracted = extractJsonFromText(text);
    try {
      parsed = JSON.parse(extracted);
    } catch (parseError) {
      const preview = text.substring(0, 300);
      const errorMsg = parseError instanceof Error ? parseError.message : "Unknown parse error";
      throw new Error(
        `Failed to parse video analysis response as JSON. Error: ${errorMsg}. Response preview: ${preview}${text.length > 300 ? "..." : ""}`
      );
    }
  }

  const colorProfileResult = normalizeColorProfile(parsed);

  const characters: CharacterSkeleton[] = [];
  if (Array.isArray(parsed.characters)) {
    for (const char of parsed.characters) {
      if (typeof char === "object" && char !== null) {
        const charObj = char as Record<string, unknown>;
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
    colorProfile: colorProfileResult.profile,
    confidence: colorProfileResult.confidence,
    characters,
    background: String(parsed.background || ""),
  };
}
