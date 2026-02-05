/**
 * VEO Test Fixtures - Character Fixtures
 * Pre-built CharacterSkeleton and CharacterRegistry fixtures
 */

import type {
  CharacterSkeleton,
  CharacterRegistry,
  CharacterExtractionResult,
  EnhancedCharacterTemplate,
} from "@/lib/prompt/types";
import { createMockCharacter, createMockCharacterRegistry } from "./factories";

// ============================================================================
// Individual Character Skeletons
// ============================================================================

/**
 * Primary character: Italian chef (male)
 */
export const chefMarco: CharacterSkeleton = {
  name: "Chef Marco",
  gender: "male",
  age: "40s",
  ethnicity: "Italian, olive skin",
  bodyType: "tall, stocky build",
  faceShape: "square jaw, prominent nose",
  hair: "salt-and-pepper, short, slicked back",
  facialHair: "trimmed goatee",
  distinctiveFeatures: "scar on left cheek, gold tooth when smiling",
  baseOutfit: "white chef coat, black apron, chef's toque",
  firstAppearance: "0:05",
};

/**
 * Secondary character: Sous chef (female)
 */
export const sousChefAnna: CharacterSkeleton = {
  name: "Sous Chef Anna",
  gender: "female",
  age: "30s",
  ethnicity: "French, fair skin with freckles",
  bodyType: "petite, athletic",
  faceShape: "oval face, high cheekbones",
  hair: "auburn, long, tied in professional bun",
  facialHair: undefined,
  distinctiveFeatures: "small mole above lip, bright green eyes",
  baseOutfit: "gray chef coat, white apron, bandana",
  firstAppearance: "0:45",
};

/**
 * Supporting character: Restaurant manager
 */
export const managerDavid: CharacterSkeleton = {
  name: "Manager David",
  gender: "male",
  age: "50s",
  ethnicity: "British, light skin",
  bodyType: "medium height, slim",
  faceShape: "long face, receding hairline",
  hair: "gray, thinning, neatly combed",
  facialHair: "clean shaven",
  distinctiveFeatures: "reading glasses on chain, walks with slight limp",
  baseOutfit: "navy suit, burgundy tie, pocket square",
  firstAppearance: "2:30",
};

/**
 * Guest character: Food critic
 */
export const criticSophia: CharacterSkeleton = {
  name: "Critic Sophia",
  gender: "female",
  age: "60s",
  ethnicity: "Spanish, warm olive skin",
  bodyType: "medium build, dignified posture",
  faceShape: "heart-shaped, elegant features",
  hair: "silver, shoulder-length, styled waves",
  facialHair: undefined,
  distinctiveFeatures: "always wears statement jewelry, carries leather notebook",
  baseOutfit: "elegant black dress, pearl necklace, designer handbag",
  firstAppearance: "5:00",
};

/**
 * Minimal character (only required fields)
 */
export const minimalCharacter: CharacterSkeleton = {
  name: "Background Diner",
  gender: "male",
  age: "30s",
  ethnicity: "mixed",
  bodyType: "average",
  faceShape: "round",
  hair: "brown, short",
  baseOutfit: "casual shirt and jeans",
};

// ============================================================================
// Enhanced Character Templates (VEO 3 15+ attributes)
// ============================================================================

/**
 * Enhanced template with 15+ attributes for maximum consistency
 */
export const enhancedChefTemplate: EnhancedCharacterTemplate = {
  // Identity (3)
  name: "Chef Marco Rossini",
  ethnicity: "Italian",
  gender: "male",

  // Physical (5)
  age: "mid-40s",
  build: "stocky",
  height: "tall, 6 feet",
  hairDetails: "salt-and-pepper, short, slicked back with natural wave, graying at temples",
  eyeDetails: "deep brown, warm, slightly hooded, crow's feet from years of smiling",

  // Facial (3)
  facialFeatures: "square jaw, prominent Roman nose, deep-set laugh lines",
  facialHair: "trimmed salt-and-pepper goatee, always well-maintained",
  skinDetails: "olive complexion, weathered from years of kitchen heat",

  // Clothing (2)
  clothingDescription: "crisp white double-breasted chef coat with restaurant logo embroidered on chest, black apron tied at waist, traditional tall chef's toque",
  accessories: "silver wedding band, vintage watch visible when sleeves rolled",

  // Behavioral (2+)
  postureMannerisms: "confident stance, often gestures with hands while explaining, leans forward when passionate",
  emotionalBaseline: "warm and welcoming with underlying intensity about craft",
  distinctiveMarks: "small scar on left cheek from kitchen accident, gold-capped molar visible when laughing",
  voiceCharacteristics: "deep baritone with slight Italian accent, speaks deliberately",
};

// ============================================================================
// Character Registries
// ============================================================================

/**
 * Registry with skeleton characters (new format)
 */
export const skeletonRegistry: CharacterRegistry = {
  "Chef Marco": chefMarco,
  "Sous Chef Anna": sousChefAnna,
  "Manager David": managerDavid,
};

/**
 * Registry with string descriptions (legacy format)
 */
export const legacyRegistry: CharacterRegistry = {
  "Chef Marco": "Italian male chef in his 40s with salt-and-pepper hair and goatee, wearing white chef coat",
  "Sous Chef Anna": "French female sous chef in her 30s with auburn hair in a bun, wearing gray chef coat",
  "Waiter": "Young server in black uniform",
};

/**
 * Mixed registry (both formats for backward compatibility testing)
 */
export const mixedRegistry: CharacterRegistry = {
  "Chef Marco": chefMarco, // Skeleton
  "Sous Chef Anna": sousChefAnna, // Skeleton
  "Waiter": "Young server in black uniform", // Legacy string
  "Background Diner": "Casual diner at table", // Legacy string
};

/**
 * Empty registry
 */
export const emptyRegistry: CharacterRegistry = {};

/**
 * Single character registry
 */
export const singleCharacterRegistry: CharacterRegistry = {
  "Chef Marco": chefMarco,
};

/**
 * Large registry (stress test)
 */
export const largeRegistry: CharacterRegistry = createMockCharacterRegistry([
  chefMarco,
  sousChefAnna,
  managerDavid,
  criticSophia,
  createMockCharacter({ name: "Line Cook 1" }),
  createMockCharacter({ name: "Line Cook 2" }),
  createMockCharacter({ name: "Dishwasher" }),
  createMockCharacter({ name: "Host" }),
  createMockCharacter({ name: "Bartender" }),
  createMockCharacter({ name: "Server 1" }),
  createMockCharacter({ name: "Server 2" }),
  createMockCharacter({ name: "Customer 1" }),
  createMockCharacter({ name: "Customer 2" }),
  createMockCharacter({ name: "Customer 3" }),
  createMockCharacter({ name: "Delivery Person" }),
]);

// ============================================================================
// Character Extraction Results
// ============================================================================

/**
 * Successful extraction with multiple characters
 */
export const extractionResultMultiple: CharacterExtractionResult = {
  characters: [chefMarco, sousChefAnna, managerDavid],
  background: "Professional restaurant kitchen with stainless steel equipment, industrial ventilation, and busy cooking stations",
};

/**
 * Extraction with single character
 */
export const extractionResultSingle: CharacterExtractionResult = {
  characters: [chefMarco],
  background: "Home kitchen with wooden counters and natural lighting",
};

/**
 * Extraction with no characters (product/scene video)
 */
export const extractionResultNoCharacters: CharacterExtractionResult = {
  characters: [],
  background: "Minimalist product photography setup with white backdrop and professional lighting",
};

/**
 * Extraction with many characters (crowd scene)
 */
export const extractionResultCrowd: CharacterExtractionResult = {
  characters: [
    chefMarco,
    sousChefAnna,
    managerDavid,
    criticSophia,
    minimalCharacter,
    createMockCharacter({ name: "Guest 1", age: "20s" }),
    createMockCharacter({ name: "Guest 2", age: "40s" }),
    createMockCharacter({ name: "Guest 3", age: "30s" }),
  ],
  background: "Busy restaurant dining room during dinner service, warm ambient lighting, tables with white tablecloths",
};

// ============================================================================
// Character Collections
// ============================================================================

/**
 * All individual character skeletons
 */
export const allCharacters: CharacterSkeleton[] = [
  chefMarco,
  sousChefAnna,
  managerDavid,
  criticSophia,
  minimalCharacter,
];

/**
 * Primary cast (main characters)
 */
export const primaryCast: CharacterSkeleton[] = [
  chefMarco,
  sousChefAnna,
];

/**
 * Supporting cast
 */
export const supportingCast: CharacterSkeleton[] = [
  managerDavid,
  criticSophia,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a registry entry is a skeleton (not a legacy string)
 */
export function isCharacterSkeleton(
  entry: string | CharacterSkeleton
): entry is CharacterSkeleton {
  return typeof entry === "object" && "name" in entry && "gender" in entry;
}

/**
 * Get all skeleton characters from a mixed registry
 */
export function getSkeletonsFromRegistry(
  registry: CharacterRegistry
): CharacterSkeleton[] {
  return Object.values(registry).filter(isCharacterSkeleton);
}

/**
 * Get character names from a registry
 */
export function getCharacterNames(registry: CharacterRegistry): string[] {
  return Object.keys(registry);
}
