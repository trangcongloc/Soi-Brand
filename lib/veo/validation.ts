/**
 * VEO 3 Quality Validation and Scoring
 * Pre-generation quality checklist and prompt scoring functions
 */

import type {
  Scene,
  QualityChecklist,
  QualityLevel,
  PromptQualityScore,
} from "./types";

// ============================================================================
// Quality Checklist Validation
// ============================================================================

/**
 * Count character attributes in description
 */
function countCharacterAttributes(character: string): number {
  if (!character || character.toLowerCase() === "none") return 0;

  // Count comma-separated and descriptive elements
  const parts = character.split(/[,;]/).filter(p => p.trim().length > 0);

  // Count additional descriptive phrases
  const descriptorPatterns = [
    /\b(male|female|man|woman)\b/i,
    /\b\d+s?\b/, // age (30s, 40, etc.)
    /\b(tall|short|medium|athletic|slim|stocky)\b/i,
    /\bhair\b/i,
    /\beyes?\b/i,
    /\b(wearing|dressed|in)\b/i,
    /\b(smile|smiling|gaze|expression)\b/i,
    /\bskin\b/i,
    /\bbeard|mustache|facial hair\b/i,
    /\b(asian|caucasian|african|latin|european|american)\b/i,
  ];

  let count = parts.length;
  descriptorPatterns.forEach(pattern => {
    if (pattern.test(character)) count++;
  });

  return Math.min(count, 20); // Cap at 20
}

/**
 * Count scene details/elements
 */
function countSceneDetails(scene: Scene): number {
  let count = 0;

  // Check visual_specs
  if (scene.visual_specs) {
    if (scene.visual_specs.environment) count += 2;
    if (scene.visual_specs.key_details) count += 2;
    if (scene.visual_specs.primary_subject) count++;
  }

  // Check lighting
  if (scene.lighting) {
    if (scene.lighting.mood) count++;
    if (scene.lighting.source) count++;
    if (scene.lighting.shadows) count++;
  }

  // Check composition
  if (scene.composition) {
    if (scene.composition.angle) count++;
    if (scene.composition.framing) count++;
    if (scene.composition.focus) count++;
  }

  // Check description length (more words = more detail)
  if (scene.description) {
    const wordCount = scene.description.split(/\s+/).length;
    count += Math.min(Math.floor(wordCount / 10), 5);
  }

  return count;
}

/**
 * Validate quality checklist for a scene
 */
export function validateQualityChecklist(scene: Scene): QualityChecklist {
  const characterCount = countCharacterAttributes(scene.character);
  const sceneDetailCount = countSceneDetails(scene);

  return {
    // 15+ attributes needed for full score
    characterDescription: characterCount >= 15,

    // 10+ elements needed for full score
    sceneDetails: sceneDetailCount >= 10,

    // Camera specs - check composition and video fields
    cameraSpecs: Boolean(
      scene.composition?.angle &&
      scene.composition?.framing &&
      (scene.video?.cameraMovement || scene.enhancedCamera)
    ),

    // Lighting - check lighting and advancedLighting
    lighting: Boolean(
      scene.lighting?.source &&
      scene.lighting?.mood &&
      (scene.advancedLighting?.setup || scene.lighting?.shadows)
    ),

    // Audio design - check audio field
    audioDesign: Boolean(
      scene.audio?.environmental ||
      scene.audio?.negations ||
      scene.video?.audioCues?.length
    ),

    // Dialogue - check dialogue field with proper formatting
    dialogue: Boolean(
      scene.dialogue?.length ||
      scene.voice
    ),

    // Negative prompts - check negativePrompt field
    negativePrompts: Boolean(
      scene.negativePrompt &&
      scene.negativePrompt.length > 20
    ),

    // Technical specs - check technical field and quality indicators
    technicalSpecs: Boolean(
      scene.technical?.quality &&
      scene.technical?.colors
    ),

    // Brand compliance - optional, always true if not applicable
    brandCompliance: true,

    // 8-second optimization - check dialogue length
    eightSecondOptimization: Boolean(
      !scene.dialogue?.length ||
      scene.dialogue.every(d => d.line.split(/\s+/).length <= 15)
    ),
  };
}

/**
 * Calculate checklist completion count
 */
export function getChecklistCompletionCount(checklist: QualityChecklist): number {
  return Object.values(checklist).filter(Boolean).length;
}

/**
 * Determine quality level from checklist
 */
export function getQualityLevel(checklist: QualityChecklist): QualityLevel {
  const count = getChecklistCompletionCount(checklist);

  if (count >= 8) return "master";
  if (count >= 6) return "professional";
  if (count >= 4) return "intermediate";
  return "basic";
}

// ============================================================================
// Prompt Quality Scoring
// ============================================================================

/**
 * Score character description (0-10)
 */
function scoreCharacterDescription(scene: Scene): number {
  const count = countCharacterAttributes(scene.character);
  // 15+ = 10, linear scale below
  return Math.min(10, Math.round((count / 15) * 10));
}

/**
 * Score scene details (0-10)
 */
function scoreSceneDetails(scene: Scene): number {
  const count = countSceneDetails(scene);
  // 10+ = 10, linear scale below
  return Math.min(10, count);
}

/**
 * Score camera specs (0-10)
 */
function scoreCameraSpecs(scene: Scene): number {
  let score = 0;

  if (scene.composition?.angle) score += 2;
  if (scene.composition?.framing) score += 2;
  if (scene.composition?.focus) score += 1;
  if (scene.video?.cameraMovement?.type) score += 2;
  if (scene.video?.cameraMovement?.direction) score += 1;
  if (scene.enhancedCamera?.positionPhrase) score += 2; // VEO 3 syntax bonus

  return Math.min(10, score);
}

/**
 * Score lighting setup (0-10)
 */
function scoreLightingSetup(scene: Scene): number {
  let score = 0;

  if (scene.lighting?.source) score += 2;
  if (scene.lighting?.mood) score += 2;
  if (scene.lighting?.shadows) score += 1;
  if (scene.advancedLighting?.setup) score += 3;
  if (scene.advancedLighting?.keyLight) score += 1;
  if (scene.advancedLighting?.rimLight) score += 1;

  return Math.min(10, score);
}

/**
 * Score audio design (0-10)
 */
function scoreAudioDesign(scene: Scene): number {
  let score = 0;

  if (scene.audio?.environmental) score += 3;
  if (scene.audio?.music) score += 2;
  if (scene.audio?.soundEffects?.length) score += 2;
  if (scene.audio?.negations?.length) score += 3; // Hallucination prevention
  if (scene.video?.audioCues?.length) score += 1;

  return Math.min(10, score);
}

/**
 * Score dialogue quality (0-10)
 */
function scoreDialogueQuality(scene: Scene): number {
  if (!scene.dialogue?.length && !scene.voice) {
    return 5; // Neutral if no dialogue
  }

  let score = 5; // Base score for having dialogue

  if (scene.dialogue?.length) {
    const dialogue = scene.dialogue[0];
    if (dialogue.delivery) score += 1;
    if (dialogue.emotion) score += 1;

    // Check 8-second rule (12-15 words)
    const wordCount = dialogue.line.split(/\s+/).length;
    if (wordCount <= 15) score += 2;
    if (wordCount <= 12) score += 1;
  }

  return Math.min(10, score);
}

/**
 * Score negative prompts (0-10)
 */
function scoreNegativePrompts(scene: Scene): number {
  if (!scene.negativePrompt) return 0;

  const negatives = scene.negativePrompt.split(",").map(n => n.trim());
  const count = negatives.length;

  // Score based on comprehensiveness
  let score = Math.min(5, count); // Up to 5 points for quantity

  // Bonus for key quality negatives
  const keyNegatives = ["subtitles", "watermark", "text", "blur", "distort", "artifact"];
  keyNegatives.forEach(key => {
    if (scene.negativePrompt!.toLowerCase().includes(key)) score += 0.5;
  });

  return Math.min(10, Math.round(score));
}

/**
 * Calculate full prompt quality score
 */
export function calculatePromptQualityScore(scene: Scene): PromptQualityScore {
  const scores = {
    characterDescription: scoreCharacterDescription(scene),
    sceneDetails: scoreSceneDetails(scene),
    cameraSpecs: scoreCameraSpecs(scene),
    lightingSetup: scoreLightingSetup(scene),
    audioDesign: scoreAudioDesign(scene),
    dialogueQuality: scoreDialogueQuality(scene),
    negativePrompts: scoreNegativePrompts(scene),
  };

  // Calculate overall score (weighted average)
  const weights = {
    characterDescription: 1.5, // More important for consistency
    sceneDetails: 1.2,
    cameraSpecs: 1.0,
    lightingSetup: 1.0,
    audioDesign: 1.0,
    dialogueQuality: 0.8,
    negativePrompts: 1.0,
  };

  const weightedSum = Object.entries(scores).reduce(
    (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
    0
  );
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const overallScore = Math.round((weightedSum / totalWeight) * 10);

  // Determine quality level
  const checklist = validateQualityChecklist(scene);
  const level = getQualityLevel(checklist);

  // Generate suggestions
  const suggestions: string[] = [];

  if (scores.characterDescription < 8) {
    suggestions.push("Add more character attributes (aim for 15+): hair details, eye color, clothing textures");
  }
  if (scores.sceneDetails < 8) {
    suggestions.push("Add more environmental details (aim for 10+): background elements, props, atmosphere");
  }
  if (scores.cameraSpecs < 7) {
    suggestions.push("Include camera positioning with '(thats where the camera is)' syntax");
  }
  if (scores.lightingSetup < 7) {
    suggestions.push("Specify professional lighting setup (three-point, rembrandt, etc.)");
  }
  if (scores.audioDesign < 5) {
    suggestions.push("Add audio specifications to prevent hallucinations: ambient sounds, negations");
  }
  if (scores.negativePrompts < 5) {
    suggestions.push("Add comprehensive negative prompts: no subtitles, no watermarks, no blur");
  }

  // Calculate generation success rate prediction
  const successRate = Math.min(99, Math.round(60 + overallScore * 4));

  return {
    level,
    scores,
    overallScore,
    generationSuccessRate: successRate,
    optimizationSuggestions: suggestions,
  };
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Validate quality for multiple scenes
 */
export function validateBatchQuality(scenes: Scene[]): {
  averageScore: number;
  averageSuccessRate: number;
  overallLevel: QualityLevel;
  sceneScores: PromptQualityScore[];
} {
  const sceneScores = scenes.map(calculatePromptQualityScore);

  const averageScore = Math.round(
    sceneScores.reduce((sum, s) => sum + s.overallScore, 0) / scenes.length
  );

  const averageSuccessRate = Math.round(
    sceneScores.reduce((sum, s) => sum + s.generationSuccessRate, 0) / scenes.length
  );

  // Determine overall level based on average score
  let overallLevel: QualityLevel;
  if (averageScore >= 8) overallLevel = "master";
  else if (averageScore >= 6) overallLevel = "professional";
  else if (averageScore >= 4) overallLevel = "intermediate";
  else overallLevel = "basic";

  return {
    averageScore,
    averageSuccessRate,
    overallLevel,
    sceneScores,
  };
}
