/**
 * Prompt Pipeline - Shared utilities and continuity context
 */

import {
  VoiceLanguage,
  AudioSettings,
  CharacterSkeleton,
  GeneratedScript,
} from "../types";

// ============================================================================
// JSON Extraction & Repair Utilities
// ============================================================================

/**
 * Extract JSON from text that may contain markdown code blocks or other formatting
 */
export function extractJsonFromText(text: string): string {
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
export function repairTruncatedJson(text: string): string {
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

// ============================================================================
// Audio Instructions
// ============================================================================

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

// ============================================================================
// Character Formatting
// ============================================================================

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
 * Format pre-extracted character skeleton for prompt inclusion
 */
export function formatCharacterSkeletonForPrompt(char: CharacterSkeleton): string {
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

// ============================================================================
// Continuity Context
// ============================================================================

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

// PERF-001 FIX: Cache for continuity context to avoid O(n²) rebuilds
// Keyed by jobId to prevent cross-request cache pollution in shared Node.js module
const continuityCache = new Map<string, {
  sceneCount: number;
  characterCount: number;
  context: string;
}>();

/**
 * Reset continuity cache for a specific job (call at job start or completion)
 */
export function resetContinuityCache(jobId: string): void {
  continuityCache.delete(jobId);
}

/**
 * Build continuity context with per-job caching for performance
 * Returns cached result if scene count hasn't changed for this job
 */
export function buildContinuityContextCached(
  jobId: string,
  previousScenes: Array<{
    description: string;
    character?: string;
    visual_specs?: { environment?: string };
  }>,
  characterRegistry: Record<string, string | CharacterSkeleton>,
  summaryMode: boolean = true,
  detailSceneCount: number = 5
): string {
  const sceneCount = previousScenes.length;
  const characterCount = Object.keys(characterRegistry).length;

  // Return cached result if scene count and character count haven't changed for this job
  const cached = continuityCache.get(jobId);
  if (cached &&
      cached.sceneCount === sceneCount &&
      cached.characterCount === characterCount) {
    return cached.context;
  }

  // Build fresh context
  const context = buildContinuityContext(previousScenes, characterRegistry, summaryMode, detailSceneCount);

  // Cache the result for this job
  continuityCache.set(jobId, { sceneCount, characterCount, context });

  return context;
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
 * Build pre-extracted characters context for scene generation (Phase 2)
 */
export function buildPreExtractedCharactersContext(
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

// ============================================================================
// Script Parsing
// ============================================================================

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
