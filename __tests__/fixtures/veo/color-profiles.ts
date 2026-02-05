/**
 * VEO Test Fixtures - Color Profile Fixtures
 * Pre-built CinematicProfile fixtures for Phase 0 testing
 */

import type {
  CinematicProfile,
  EnrichedColorEntry,
  ColorProfileExtractionResult,
} from "@/lib/veo/types";

// ============================================================================
// Enriched Color Entries
// ============================================================================

export const warmGold: EnrichedColorEntry = {
  hex: "#D4A574",
  name: "warm gold",
  usage: "highlights, food warmth",
  semanticName: "honey butter warmth",
  moods: ["inviting", "appetizing", "homey"],
  temperature: "warm",
  psychologyNotes: "Evokes comfort, quality, and culinary excellence",
  confidence: 0.95,
};

export const deepBrown: EnrichedColorEntry = {
  hex: "#3D2914",
  name: "deep brown",
  usage: "shadows, wood tones",
  semanticName: "roasted coffee depth",
  moods: ["grounded", "rustic", "authentic"],
  temperature: "warm",
  psychologyNotes: "Suggests tradition, craftsmanship, earthiness",
  confidence: 0.92,
};

export const creamWhite: EnrichedColorEntry = {
  hex: "#F5F0E6",
  name: "cream white",
  usage: "highlights, plates, chef coat",
  semanticName: "fresh cream highlight",
  moods: ["clean", "fresh", "professional"],
  temperature: "neutral",
  psychologyNotes: "Conveys cleanliness and culinary precision",
  confidence: 0.98,
};

export const sageGreen: EnrichedColorEntry = {
  hex: "#7A8B6F",
  name: "sage green",
  usage: "herbs, fresh ingredients",
  semanticName: "garden herb freshness",
  moods: ["fresh", "natural", "healthy"],
  temperature: "cool",
  psychologyNotes: "Represents freshness, farm-to-table, vitality",
  confidence: 0.88,
};

export const copperAccent: EnrichedColorEntry = {
  hex: "#B87333",
  name: "copper accent",
  usage: "pots, accents, warmth",
  semanticName: "burnished copper gleam",
  moods: ["premium", "artisanal", "classic"],
  temperature: "warm",
  psychologyNotes: "Signals quality cookware, professional standards",
  confidence: 0.91,
};

export const steelGray: EnrichedColorEntry = {
  hex: "#6B7B8A",
  name: "steel gray",
  usage: "equipment, neutral tones",
  semanticName: "professional steel neutral",
  moods: ["industrial", "professional", "modern"],
  temperature: "cool",
  psychologyNotes: "Represents professional kitchen environment",
  confidence: 0.89,
};

export const tomatoRed: EnrichedColorEntry = {
  hex: "#C94C4C",
  name: "tomato red",
  usage: "accent, ingredients",
  semanticName: "ripe tomato vibrancy",
  moods: ["energetic", "passionate", "appetizing"],
  temperature: "warm",
  psychologyNotes: "Creates visual appetite appeal, energy",
  confidence: 0.86,
};

export const midnightBlue: EnrichedColorEntry = {
  hex: "#1A2A3A",
  name: "midnight blue",
  usage: "deep shadows, contrast",
  semanticName: "evening dining elegance",
  moods: ["sophisticated", "mysterious", "upscale"],
  temperature: "cool",
  psychologyNotes: "Suggests fine dining, evening atmosphere",
  confidence: 0.84,
};

// ============================================================================
// Complete Cinematic Profiles
// ============================================================================

/**
 * Full cinematic profile for a warm cooking video
 */
export const fullColorProfile: CinematicProfile = {
  dominantColors: [
    warmGold,
    deepBrown,
    creamWhite,
    sageGreen,
    copperAccent,
    steelGray,
  ],
  colorTemperature: {
    category: "warm",
    kelvinEstimate: 4500,
    description: "Warm tungsten-balanced lighting with golden undertones, typical of professional kitchen environments",
  },
  contrast: {
    level: "medium",
    style: "filmic with lifted shadows",
    blackPoint: "#1A1512",
    whitePoint: "#FFF8F0",
  },
  shadows: {
    color: "warm brown (#3D2914)",
    density: "medium, with detail preserved",
    falloff: "gradual, soft transitions",
  },
  highlights: {
    color: "cream with golden tint (#F5E6D3)",
    handling: "rolled off gently, no harsh clipping",
    bloom: true,
  },
  filmStock: {
    suggested: "Kodak Portra 400",
    characteristics: "warm skin tones, subtle grain, excellent shadow detail",
    digitalProfile: "ARRI LogC to Rec709 with warm LUT",
  },
  mood: {
    primary: "inviting and professional",
    atmosphere: "warm, cozy kitchen ambiance",
    emotionalTone: "comfortable expertise, approachable mastery",
  },
  grain: {
    amount: "subtle",
    type: "fine organic grain",
    pattern: "uniform distribution, more visible in shadows",
  },
  postProcessing: {
    colorGrade: "warm film emulation with lifted shadows",
    saturation: "slightly boosted for food appeal",
    vignettePresent: true,
    splitToning: {
      shadows: "#2A1F1A",
      highlights: "#F5E6D3",
    },
  },
};

/**
 * Cool/modern profile for tech or product videos
 */
export const coolModernProfile: CinematicProfile = {
  dominantColors: [
    steelGray,
    midnightBlue,
    creamWhite,
    {
      hex: "#00A8E8",
      name: "tech blue",
      usage: "accent, highlights",
      semanticName: "digital innovation blue",
      moods: ["modern", "innovative", "clean"],
      temperature: "cool",
      confidence: 0.9,
    },
    {
      hex: "#2D3436",
      name: "charcoal",
      usage: "shadows, backgrounds",
      semanticName: "sleek shadow charcoal",
      moods: ["professional", "minimal", "premium"],
      temperature: "neutral",
      confidence: 0.92,
    },
  ],
  colorTemperature: {
    category: "cool",
    kelvinEstimate: 6500,
    description: "Daylight balanced with slight blue cast for modern, clean aesthetic",
  },
  contrast: {
    level: "high",
    style: "crisp and punchy",
    blackPoint: "#0A0A0A",
    whitePoint: "#FFFFFF",
  },
  shadows: {
    color: "blue-black (#1A1E2A)",
    density: "deep, with crushed blacks",
    falloff: "sharp, defined edges",
  },
  highlights: {
    color: "pure white with blue tint",
    handling: "preserved highlights, slight bloom",
    bloom: true,
  },
  filmStock: {
    suggested: "Digital native",
    characteristics: "clean, low noise, high dynamic range",
    digitalProfile: "Sony S-Log3 to Rec709",
  },
  mood: {
    primary: "modern and innovative",
    atmosphere: "clean, professional, cutting-edge",
    emotionalTone: "confident expertise, forward-thinking",
  },
  grain: {
    amount: "none",
    type: "digital clean",
    pattern: "none",
  },
  postProcessing: {
    colorGrade: "teal and orange variation, desaturated",
    saturation: "selectively desaturated except accents",
    vignettePresent: false,
  },
};

/**
 * Moody/dramatic profile for cinematic storytelling
 */
export const moodyDramaticProfile: CinematicProfile = {
  dominantColors: [
    midnightBlue,
    deepBrown,
    {
      hex: "#8B0000",
      name: "dark red",
      usage: "dramatic accent",
      semanticName: "dramatic crimson depth",
      moods: ["intense", "dramatic", "passionate"],
      temperature: "warm",
      confidence: 0.85,
    },
    {
      hex: "#2C3E50",
      name: "dark slate",
      usage: "shadows, atmosphere",
      semanticName: "stormy slate mystery",
      moods: ["mysterious", "tense", "dramatic"],
      temperature: "cool",
      confidence: 0.88,
    },
  ],
  colorTemperature: {
    category: "mixed",
    kelvinEstimate: 4000,
    description: "Mixed temperature with warm practicals and cool ambient",
  },
  contrast: {
    level: "extreme",
    style: "chiaroscuro, dramatic light and shadow",
    blackPoint: "#000000",
    whitePoint: "#E8E8E8",
  },
  shadows: {
    color: "pure black with blue undertone",
    density: "very dense, crushed",
    falloff: "sharp, dramatic",
  },
  highlights: {
    color: "warm amber (#E8D4B8)",
    handling: "selective, dramatic pools of light",
    bloom: false,
  },
  filmStock: {
    suggested: "Kodak Vision3 500T",
    characteristics: "cinematic grain, rich shadows, tungsten balance",
    digitalProfile: "ARRI LogC with cinematic LUT",
  },
  mood: {
    primary: "dramatic and intense",
    atmosphere: "mysterious, tension-filled",
    emotionalTone: "suspenseful, emotionally charged",
  },
  grain: {
    amount: "moderate",
    type: "coarse cinematic grain",
    pattern: "organic, more prominent in shadows",
  },
  postProcessing: {
    colorGrade: "desaturated with selective warm accents",
    saturation: "heavily desaturated except practicals",
    vignettePresent: true,
    splitToning: {
      shadows: "#1A1A2E",
      highlights: "#D4A574",
    },
  },
};

/**
 * Minimal profile (edge case testing)
 */
export const minimalProfile: CinematicProfile = {
  dominantColors: [
    {
      hex: "#808080",
      name: "gray",
      usage: "general",
      semanticName: "neutral gray",
      moods: ["neutral"],
      temperature: "neutral",
      confidence: 0.7,
    },
  ],
  colorTemperature: {
    category: "neutral",
    kelvinEstimate: 5500,
    description: "Neutral daylight",
  },
  contrast: {
    level: "medium",
    style: "standard",
    blackPoint: "#000000",
    whitePoint: "#FFFFFF",
  },
  shadows: {
    color: "neutral gray",
    density: "medium",
    falloff: "standard",
  },
  highlights: {
    color: "white",
    handling: "standard",
    bloom: false,
  },
  filmStock: {
    suggested: "Standard",
    characteristics: "neutral",
  },
  mood: {
    primary: "neutral",
    atmosphere: "standard",
    emotionalTone: "neutral",
  },
  grain: {
    amount: "none",
    type: "none",
    pattern: "none",
  },
  postProcessing: {
    colorGrade: "none",
    saturation: "normal",
    vignettePresent: false,
  },
};

// ============================================================================
// Color Profile Extraction Results
// ============================================================================

/**
 * High confidence extraction result
 */
export const extractionResultHighConfidence: ColorProfileExtractionResult = {
  profile: fullColorProfile,
  confidence: 0.95,
};

/**
 * Medium confidence extraction result
 */
export const extractionResultMediumConfidence: ColorProfileExtractionResult = {
  profile: coolModernProfile,
  confidence: 0.75,
};

/**
 * Low confidence extraction result (edge case)
 */
export const extractionResultLowConfidence: ColorProfileExtractionResult = {
  profile: minimalProfile,
  confidence: 0.45,
};

// ============================================================================
// Profile Collections
// ============================================================================

/**
 * All color profiles
 */
export const allProfiles: CinematicProfile[] = [
  fullColorProfile,
  coolModernProfile,
  moodyDramaticProfile,
  minimalProfile,
];

/**
 * All enriched color entries
 */
export const allColorEntries: EnrichedColorEntry[] = [
  warmGold,
  deepBrown,
  creamWhite,
  sageGreen,
  copperAccent,
  steelGray,
  tomatoRed,
  midnightBlue,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a custom color profile with overrides
 */
export function createCustomProfile(
  overrides: Partial<CinematicProfile>
): CinematicProfile {
  return {
    ...fullColorProfile,
    ...overrides,
  };
}

/**
 * Create a color entry with custom values
 */
export function createColorEntry(
  hex: string,
  name: string,
  options: Partial<EnrichedColorEntry> = {}
): EnrichedColorEntry {
  return {
    hex,
    name,
    usage: options.usage ?? "general",
    semanticName: options.semanticName ?? name,
    moods: options.moods ?? ["neutral"],
    temperature: options.temperature ?? "neutral",
    psychologyNotes: options.psychologyNotes,
    confidence: options.confidence ?? 0.8,
  };
}
