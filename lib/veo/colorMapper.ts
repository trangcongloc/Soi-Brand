/**
 * Hex-to-Semantic Color Mapper
 *
 * Maps raw hex color codes to nearest cinematic color using
 * Euclidean distance in RGB color space.
 */

import {
  CINEMATIC_COLORS,
  type CinematicColorDefinition,
  type ColorUsage,
  type ColorMood,
  type ColorTemperature
} from './colorVocabulary';

import type { ColorEntry, EnrichedColorEntry } from './types';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface CinematicColorMatch extends CinematicColorDefinition {
  confidence: number; // 0-1: mapping confidence score
}

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB components
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert RGB object to hex color
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Calculate Euclidean distance between two colors in RGB space
 * Max distance is ~441.67 (from black to white)
 */
export function colorDistance(c1: RGB, c2: RGB): number {
  const rDiff = c1.r - c2.r;
  const gDiff = c1.g - c2.g;
  const bDiff = c1.b - c2.b;
  return Math.sqrt(rDiff ** 2 + gDiff ** 2 + bDiff ** 2);
}

/**
 * Find the nearest cinematic color to a given hex code
 *
 * @param hex - Hex color code (e.g., "#1a3a5c")
 * @param context - Optional usage context to filter color vocabulary
 * @returns Best matching cinematic color with confidence score
 */
export function findNearestCinematicColor(
  hex: string,
  context?: ColorUsage
): CinematicColorMatch {
  const rgb = hexToRgb(hex);

  // Filter vocabulary by context if provided
  const vocabulary = context
    ? CINEMATIC_COLORS.filter(c => c.usageContexts.includes(context))
    : CINEMATIC_COLORS;

  // Handle edge case: empty vocabulary after filtering — fall back to full list
  if (vocabulary.length === 0) {
    if (CINEMATIC_COLORS.length === 0) {
      // Absolute fallback — no colors defined at all
      return {
        id: "unknown",
        semanticName: "Unknown",
        hex,
        rgb,
        moods: [],
        usageContexts: [],
        temperature: "neutral" as ColorTemperature,
        psychologyNotes: "",
        confidence: 0,
      };
    }
    return findNearestCinematicColor(hex); // Retry with full vocabulary (no context)
  }

  let minDistance = Infinity;
  let bestMatch = vocabulary[0];

  // Find color with minimum distance
  for (const color of vocabulary) {
    const distance = colorDistance(rgb, color.rgb);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = color;
    }
  }

  // Normalize distance to 0-1 confidence score
  // Max RGB distance is sqrt(255^2 * 3) ≈ 441.67
  const confidence = 1 - (minDistance / 441.67);

  return {
    ...bestMatch,
    confidence: Math.max(0, Math.min(1, confidence)) // Clamp to [0, 1]
  };
}

/**
 * Build semantic color description for prompts
 *
 * @param color - Cinematic color match
 * @param includeMood - Whether to include mood tags in parentheses
 * @returns Formatted semantic description
 *
 * @example
 * // Returns: "deep ocean mystery blue (mysterious, professional)"
 * buildSemanticColorDescription(color, true)
 *
 * @example
 * // Returns: "deep ocean mystery blue"
 * buildSemanticColorDescription(color, false)
 */
export function buildSemanticColorDescription(
  color: CinematicColorMatch | CinematicColorDefinition,
  includeMood: boolean = true
): string {
  if (!includeMood || !color.moods || color.moods.length === 0) {
    return color.semanticName;
  }

  // Include top 2 moods for conciseness
  const moodText = color.moods.slice(0, 2).join(", ");
  return `${color.semanticName} (${moodText})`;
}

/**
 * Enrich a color entry with semantic data from vocabulary
 *
 * @param entry - Basic color entry with hex code
 * @returns Enhanced color entry with semantic name, moods, and psychology
 */
export function enrichColorEntry(entry: ColorEntry): EnrichedColorEntry {
  const match = findNearestCinematicColor(
    entry.hex,
    entry.usage as ColorUsage | undefined
  );

  return {
    ...entry,
    semanticName: match.semanticName,
    moods: match.moods,
    temperature: match.temperature,
    psychologyNotes: match.psychologyNotes,
    confidence: match.confidence
  };
}

/**
 * Check if a color name is too generic
 * A name is generic if it's just a color term or has very little descriptive context
 */
export function isGenericName(name: string): boolean {
  const genericTerms = [
    "blue", "red", "green", "yellow", "orange",
    "purple", "pink", "brown", "gray", "grey",
    "teal", "cyan", "magenta", "violet",
    "cool", "warm", "dark", "light", "bright", "pale"
  ];

  const nameLower = name.toLowerCase();
  const words = nameLower.split(/\s+/);

  // If name is just a single generic term
  if (words.length === 1 && genericTerms.includes(words[0])) {
    return true;
  }

  // If name is only 2 words and ends/starts with generic term (e.g., "dark blue", "warm orange")
  if (words.length === 2) {
    const firstWord = words[0];
    const lastWord = words[1];
    const hasGenericTerm = genericTerms.includes(firstWord) || genericTerms.includes(lastWord);
    if (hasGenericTerm) {
      return true;
    }
  }

  // If it has 3+ words, it's descriptive enough (e.g., "deep ocean mystery blue")
  return false;
}

/**
 * Check if moods are sufficient (at least 2 meaningful moods)
 */
export function hasGoodMoods(moods: string[] | undefined): boolean {
  return moods !== undefined && moods.length >= 2;
}

/**
 * Check if semantic name is good enough
 */
export function hasGoodSemanticName(name: string | undefined): boolean {
  if (!name) return false;
  if (name.length < 10) return false; // Too short
  if (isGenericName(name)) return false;
  return true;
}

/**
 * Batch enrich multiple color entries
 */
export function enrichColorEntries(entries: ColorEntry[]): EnrichedColorEntry[] {
  return entries.map(entry => enrichColorEntry(entry));
}

/**
 * Get recommended colors by mood combination
 */
export function getRecommendedColors(
  moods: ColorMood[],
  limit: number = 5
): CinematicColorDefinition[] {
  // Score colors by how many requested moods they have
  const scored = CINEMATIC_COLORS.map(color => {
    const matchCount = color.moods.filter(mood => moods.includes(mood)).length;
    return { color, score: matchCount };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return top N colors
  return scored.slice(0, limit).map(s => s.color);
}

/**
 * Get color palette suggestion based on mood + temperature
 */
export function suggestPalette(
  mood: ColorMood,
  temperature: ColorTemperature,
  count: number = 3
): CinematicColorDefinition[] {
  const candidates = CINEMATIC_COLORS.filter(
    color => color.moods.includes(mood) && color.temperature === temperature
  );

  // If not enough matches, relax temperature constraint
  if (candidates.length < count) {
    return CINEMATIC_COLORS
      .filter(color => color.moods.includes(mood))
      .slice(0, count);
  }

  return candidates.slice(0, count);
}
