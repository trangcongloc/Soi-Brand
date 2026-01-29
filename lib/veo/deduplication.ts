/**
 * VEO Scene Deduplication System
 *
 * Detects and removes duplicate or highly similar scenes to improve
 * output quality and reduce redundancy in multi-batch generation.
 */

import type { Scene } from "./types";

import {
  MIN_WORD_LENGTH_TOKENIZE,
  SIMILARITY_MAX,
  SIMILARITY_MIN,
  DEFAULT_DEDUP_THRESHOLD,
  WEIGHT_DESCRIPTION,
  WEIGHT_CHARACTER,
  WEIGHT_OBJECT,
  WEIGHT_ENVIRONMENT,
  WEIGHT_LIGHTING,
  WEIGHT_COMPOSITION,
  WEIGHT_PROMPT,
  LIGHTING_FIELD_COUNT,
  COMPOSITION_FIELD_COUNT,
} from "./constants";

// ============================================================================
// Types
// ============================================================================

export interface SceneSimilarity {
  scene1Index: number;
  scene2Index: number;
  similarity: number; // 0.0 to 1.0
  reason: string;
}

export interface DeduplicationResult {
  unique: Scene[];
  duplicates: Scene[];
  similarities: SceneSimilarity[];
}

export interface DeduplicationConfig {
  enabled: boolean;
  similarityThreshold: number; // 0.0-1.0, default 0.75
  algorithm: "word-overlap" | "tfidf" | "semantic";
}

// ============================================================================
// Text Similarity Helpers
// ============================================================================

/**
 * Tokenize text into normalized words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > MIN_WORD_LENGTH_TOKENIZE);
}

/**
 * Calculate Jaccard similarity (word overlap) between two texts
 * Returns value between 0.0 (no overlap) and 1.0 (identical)
 */
function jaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  if (tokens1.size === 0 && tokens2.size === 0) return SIMILARITY_MAX;
  if (tokens1.size === 0 || tokens2.size === 0) return SIMILARITY_MIN;

  const intersection = new Set(Array.from(tokens1).filter((x) => tokens2.has(x)));
  const union = new Set([...Array.from(tokens1), ...Array.from(tokens2)]);

  return intersection.size / union.size;
}

/**
 * Calculate cosine similarity using word frequency vectors
 * More sophisticated than Jaccard, considers word frequency
 */
function cosineSimilarity(text1: string, text2: string): number {
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.length === 0 && tokens2.length === 0) return SIMILARITY_MAX;
  if (tokens1.length === 0 || tokens2.length === 0) return SIMILARITY_MIN;

  // Build word frequency maps
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();

  tokens1.forEach((word) => freq1.set(word, (freq1.get(word) || 0) + 1));
  tokens2.forEach((word) => freq2.set(word, (freq2.get(word) || 0) + 1));

  // Get all unique words
  const allWords = new Set([...Array.from(freq1.keys()), ...Array.from(freq2.keys())]);

  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (const word of Array.from(allWords)) {
    const f1 = freq1.get(word) || 0;
    const f2 = freq2.get(word) || 0;

    dotProduct += f1 * f2;
    magnitude1 += f1 * f1;
    magnitude2 += f2 * f2;
  }

  if (magnitude1 === 0 || magnitude2 === 0) return SIMILARITY_MIN;

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

// ============================================================================
// Scene Field Comparison Functions
// ============================================================================

/**
 * Compare scene descriptions using word overlap
 */
export function compareDescriptions(desc1: string, desc2: string): number {
  // Use cosine similarity for better accuracy
  return cosineSimilarity(desc1, desc2);
}

/**
 * Compare character fields
 * Handles both legacy strings and new CharacterSkeleton objects
 */
export function compareCharacters(char1: string, char2: string): number {
  // Both empty = identical
  if ((!char1 || char1.trim() === "") && (!char2 || char2.trim() === "")) return SIMILARITY_MAX;

  // One empty, one not = completely different
  if (!char1 || !char2) return SIMILARITY_MIN;

  // Exact match (e.g., "No characters" or character names)
  if (char1.trim() === char2.trim()) return SIMILARITY_MAX;

  // Check for character name overlap
  const names1 = extractCharacterNames(char1);
  const names2 = extractCharacterNames(char2);

  if (names1.length === 0 && names2.length === 0) return SIMILARITY_MAX;
  if (names1.length === 0 || names2.length === 0) return SIMILARITY_MIN;

  const overlap = names1.filter((name) => names2.includes(name)).length;
  const total = new Set([...names1, ...names2]).size;

  return overlap / total;
}

/**
 * Extract character names from character field
 * Handles formats like "Chef Marco", "Chef Marco, Sous Chef Anna"
 */
function extractCharacterNames(charField: string): string[] {
  // Split by common delimiters
  const parts = charField.split(/[,;]\s*/);
  return parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p.toLowerCase() !== "no characters");
}

/**
 * Compare object/prop fields
 */
export function compareObjects(obj1: string, obj2: string): number {
  if (!obj1 || !obj2) return SIMILARITY_MIN;
  if (obj1.trim() === obj2.trim()) return SIMILARITY_MAX;

  // Use Jaccard similarity for objects (simpler check)
  return jaccardSimilarity(obj1, obj2);
}

/**
 * Compare environment descriptions
 */
export function compareEnvironments(env1: string, env2: string): number {
  if (!env1 || !env2) return SIMILARITY_MIN;
  if (env1.trim() === env2.trim()) return SIMILARITY_MAX;

  // Use cosine similarity
  return cosineSimilarity(env1, env2);
}

/**
 * Compare lighting settings
 */
function compareLighting(
  lighting1: { mood: string; source: string; shadows: string },
  lighting2: { mood: string; source: string; shadows: string }
): number {
  const moodMatch = lighting1.mood === lighting2.mood ? SIMILARITY_MAX : SIMILARITY_MIN;
  const sourceMatch = lighting1.source === lighting2.source ? SIMILARITY_MAX : SIMILARITY_MIN;
  const shadowMatch = lighting1.shadows === lighting2.shadows ? SIMILARITY_MAX : SIMILARITY_MIN;

  return (moodMatch + sourceMatch + shadowMatch) / LIGHTING_FIELD_COUNT;
}

/**
 * Compare composition settings
 */
function compareComposition(
  comp1: { angle: string; framing: string; focus: string },
  comp2: { angle: string; framing: string; focus: string }
): number {
  const angleMatch = comp1.angle === comp2.angle ? SIMILARITY_MAX : SIMILARITY_MIN;
  const framingMatch = comp1.framing === comp2.framing ? SIMILARITY_MAX : SIMILARITY_MIN;
  const focusMatch = comp1.focus === comp2.focus ? SIMILARITY_MAX : SIMILARITY_MIN;

  return (angleMatch + framingMatch + focusMatch) / COMPOSITION_FIELD_COUNT;
}

// ============================================================================
// Main Similarity Calculation
// ============================================================================

/**
 * Calculate overall similarity between two scenes
 * Returns a value between 0.0 (completely different) and 1.0 (identical)
 *
 * Weights:
 * - Description: 50% (most important for detecting duplicates)
 * - Characters: 15%
 * - Objects: 10%
 * - Environment: 10%
 * - Lighting: 5%
 * - Composition: 5%
 * - Prompt: 5%
 */
export function calculateSceneSimilarity(
  scene1: Scene,
  scene2: Scene
): number {
  // 1. Description similarity (highest weight)
  const descSimilarity = compareDescriptions(
    scene1.description,
    scene2.description
  );

  // 2. Character similarity
  const charSimilarity = compareCharacters(scene1.character, scene2.character);

  // 3. Object/prop similarity
  const objSimilarity = compareObjects(scene1.object, scene2.object);

  // 4. Environment similarity
  const envSimilarity = compareEnvironments(
    scene1.visual_specs.environment,
    scene2.visual_specs.environment
  );

  // 5. Lighting similarity
  const lightingSimilarity = compareLighting(scene1.lighting, scene2.lighting);

  // 6. Composition similarity
  const compositionSimilarity = compareComposition(
    scene1.composition,
    scene2.composition
  );

  // 7. Prompt similarity (less weight, as it's auto-generated)
  const promptSimilarity = cosineSimilarity(scene1.prompt, scene2.prompt);

  // Weighted average
  const similarity =
    descSimilarity * WEIGHT_DESCRIPTION +
    charSimilarity * WEIGHT_CHARACTER +
    objSimilarity * WEIGHT_OBJECT +
    envSimilarity * WEIGHT_ENVIRONMENT +
    lightingSimilarity * WEIGHT_LIGHTING +
    compositionSimilarity * WEIGHT_COMPOSITION +
    promptSimilarity * WEIGHT_PROMPT;

  return similarity;
}

// ============================================================================
// Deduplication Logic
// ============================================================================

/**
 * Remove duplicate/similar scenes from a new batch
 *
 * @param existingScenes - All scenes generated so far
 * @param newScenes - New batch of scenes to check for duplicates
 * @param threshold - Similarity threshold (0.0-1.0). Scenes above this are considered duplicates
 * @returns Unique scenes, duplicates, and similarity scores
 */
export function deduplicateScenes(
  existingScenes: Scene[],
  newScenes: Scene[],
  threshold: number = DEFAULT_DEDUP_THRESHOLD
): DeduplicationResult {
  const unique: Scene[] = [];
  const duplicates: Scene[] = [];
  const similarities: SceneSimilarity[] = [];

  for (const newScene of newScenes) {
    let isDuplicate = false;

    // Check against all existing scenes
    for (let i = 0; i < existingScenes.length; i++) {
      const similarity = calculateSceneSimilarity(
        existingScenes[i],
        newScene
      );

      if (similarity >= threshold) {
        duplicates.push(newScene);
        similarities.push({
          scene1Index: i,
          scene2Index: existingScenes.length + unique.length,
          similarity,
          reason: `High similarity with scene ${i + 1}: ${(similarity * 100).toFixed(1)}%`,
        });
        isDuplicate = true;
        break;
      }
    }

    // If not a duplicate of existing scenes, check against other new scenes in this batch
    if (!isDuplicate) {
      for (let i = 0; i < unique.length; i++) {
        const similarity = calculateSceneSimilarity(unique[i], newScene);

        if (similarity >= threshold) {
          duplicates.push(newScene);
          similarities.push({
            scene1Index: existingScenes.length + i,
            scene2Index: existingScenes.length + unique.length,
            similarity,
            reason: `High similarity with new scene: ${(similarity * 100).toFixed(1)}%`,
          });
          isDuplicate = true;
          break;
        }
      }
    }

    // Add to unique list if not a duplicate
    if (!isDuplicate) {
      unique.push(newScene);
    }
  }

  return { unique, duplicates, similarities };
}

/**
 * Find all similar scene pairs in a scene list (for debugging/analysis)
 *
 * @param scenes - List of scenes to analyze
 * @param threshold - Similarity threshold
 * @returns Array of similar scene pairs
 */
export function findSimilarScenes(
  scenes: Scene[],
  threshold: number = DEFAULT_DEDUP_THRESHOLD
): SceneSimilarity[] {
  const similarities: SceneSimilarity[] = [];

  for (let i = 0; i < scenes.length - 1; i++) {
    for (let j = i + 1; j < scenes.length; j++) {
      const similarity = calculateSceneSimilarity(scenes[i], scenes[j]);

      if (similarity >= threshold) {
        similarities.push({
          scene1Index: i,
          scene2Index: j,
          similarity,
          reason: `Scenes ${i + 1} and ${j + 1} are ${(similarity * 100).toFixed(1)}% similar`,
        });
      }
    }
  }

  return similarities.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Get deduplication statistics for a batch
 */
export function getDeduplicationStats(result: DeduplicationResult): {
  totalProcessed: number;
  uniqueCount: number;
  duplicateCount: number;
  removalRate: number;
  averageSimilarity: number;
} {
  const totalProcessed = result.unique.length + result.duplicates.length;
  const duplicateCount = result.duplicates.length;
  const removalRate =
    totalProcessed > 0 ? duplicateCount / totalProcessed : 0;

  const averageSimilarity =
    result.similarities.length > 0
      ? result.similarities.reduce((sum, s) => sum + s.similarity, 0) /
        result.similarities.length
      : 0;

  return {
    totalProcessed,
    uniqueCount: result.unique.length,
    duplicateCount,
    removalRate,
    averageSimilarity,
  };
}
