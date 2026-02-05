/**
 * VEO Test Fixtures - Scene Fixtures
 * Pre-built Scene fixtures for testing scene rendering and processing
 */

import type { Scene, MediaType } from "@/lib/veo/types";
import { createMockScene } from "./factories";

// ============================================================================
// Minimal Scenes
// ============================================================================

/**
 * Minimal valid scene with only required fields.
 * Use for testing minimum data requirements.
 */
export const minimalScene: Scene = {
  description: "A simple scene",
  object: "table",
  character: "person",
  style: {
    genre: "documentary",
    art_movement: "realism",
    medium: "digital",
    palette: "neutral",
    color_temperature: "5600K",
    contrast: "medium",
    texture: "smooth",
    brushwork_or_line: "clean",
    rendering_engine: "native",
    camera_lens: "50mm",
    focal_length: "50mm",
    depth_of_field: "medium",
    film_stock_or_profile: "natural",
    grain: "none",
    noise_reduction: "standard",
    post_processing: "none",
    composition_style: "centered",
    mood: "neutral",
    lighting_style: "natural",
  },
  visual_specs: {
    primary_subject: "Person at table",
    environment: "Indoor room",
    key_details: "Simple setup",
  },
  lighting: {
    mood: "neutral",
    source: "window",
    shadows: "soft",
  },
  composition: {
    angle: "eye level",
    framing: "medium",
    focus: "center",
  },
  technical: {
    quality: "HD",
    colors: "sRGB",
  },
  prompt: "Person sitting at table in simple room",
};

/**
 * Scene with ID and sequence.
 */
export const sequencedScene: Scene = {
  ...minimalScene,
  id: "scene-001",
  sequence: 1,
};

// ============================================================================
// Full Scenes (with all VEO 3 fields)
// ============================================================================

/**
 * Full scene with all VEO 3 enhanced fields populated.
 * Use for testing complete scene rendering.
 */
export const fullScene: Scene = createMockScene({
  id: "full-scene-001",
  sequence: 1,
  description: "Chef Marco expertly julienning vegetables with precision knife skills",
  object: "chef's knife, cutting board, fresh vegetables",
  character: "Chef Marco",
  prompt: "Cinematic close-up of experienced Italian chef in his 40s with salt-and-pepper hair and trimmed goatee, wearing white chef coat and black apron, expertly julienning colorful vegetables on wooden cutting board, professional kitchen with stainless steel background, warm golden hour lighting from window, shallow depth of field, Kodak Portra 400 film look, no text or watermarks",
  negativePrompt: "text, watermark, subtitle, low quality, blurry, amateur, messy kitchen",
  voice: "The knife glides through the vegetables with practiced ease",
  characterVariations: {
    "Chef Marco": {
      expression: "focused concentration",
      pose: "leaning slightly forward over cutting board",
      accessories: "wearing latex gloves",
    },
  },
});

/**
 * Scene with video-specific settings.
 */
export const videoScene: Scene = {
  ...fullScene,
  id: "video-scene-001",
  mediaType: "video" as MediaType,
  video: {
    duration: 6,
    fps: 24,
    speed: "normal",
    cameraMovement: {
      type: "dolly",
      direction: "in",
      intensity: "subtle",
      path: "slow push toward subject hands",
    },
    subjectMotion: {
      primary: "Knife moves rhythmically through vegetables",
      secondary: "Steam rises gently from nearby pot",
      background: "Subtle activity in kitchen background",
    },
    transitionIn: "cut",
    transitionOut: "dissolve",
    continuity: {
      matchAction: true,
      matchColor: true,
      notes: "Continue from wide establishing shot",
    },
    audioCues: ["knife on wood", "sizzling in background", "kitchen ambiance"],
  },
};

/**
 * Scene with image-specific settings.
 */
export const imageScene: Scene = {
  ...minimalScene,
  id: "image-scene-001",
  mediaType: "image" as MediaType,
  image: {
    aspectRatio: "16:9",
    resolution: "4k",
    styleWeight: 75,
    detailLevel: "high",
  },
};

// ============================================================================
// Scenes with VEO 3 Audio
// ============================================================================

/**
 * Scene with full audio specification.
 */
export const sceneWithAudio: Scene = {
  ...fullScene,
  id: "audio-scene-001",
  audio: {
    environmental: {
      ambiance: "busy professional kitchen",
      intensity: "moderate",
      spatialPosition: "surrounding",
    },
    music: {
      mood: "uplifting",
      genre: "light jazz",
      volume: "background",
      tempo: "moderate",
    },
    soundEffects: [
      {
        sound: "knife chopping on wood",
        trigger: "as chef cuts vegetables",
        intensity: "prominent",
      },
      {
        sound: "sizzling pan",
        trigger: "background continuous",
        intensity: "subtle",
      },
    ],
    hallucinationPrevention: {
      expectedAmbient: ["kitchen ventilation", "distant chatter", "pots clinking"],
      expectedEffects: ["knife on cutting board", "vegetables dropping"],
      preventedSounds: ["audience reaction", "applause", "laugh track"],
      roomTone: "busy",
      acoustics: "room",
    },
    negations: ["no audience sounds", "no laugh track", "no applause"],
  },
};

// ============================================================================
// Scenes with VEO 3 Dialogue
// ============================================================================

/**
 * Scene with dialogue specification.
 */
export const sceneWithDialogue: Scene = {
  ...fullScene,
  id: "dialogue-scene-001",
  dialogue: [
    {
      character: "Chef Marco",
      line: "The secret is in the angle of the cut",
      delivery: "with warm enthusiasm",
      emotion: "passionate about teaching",
      timing: "middle",
    },
  ],
  textOverlayPrevention: {
    noSubtitles: true,
    noOnScreenText: true,
    noCaptions: true,
    noWatermarks: true,
    method: "colon-format",
  },
};

// ============================================================================
// Scenes with VEO 3 Camera
// ============================================================================

/**
 * Scene with enhanced camera specification.
 */
export const sceneWithEnhancedCamera: Scene = {
  ...fullScene,
  id: "camera-scene-001",
  enhancedCamera: {
    type: "dolly",
    direction: "in",
    intensity: "subtle",
    position: "at counter level",
    height: "eye-level",
    distance: "medium",
    movementTiming: {
      startAt: 1,
      duration: 4,
      easing: "ease-in-out",
    },
    positionPhrase: "at counter level (thats where the camera is)",
  },
  movementQuality: "fluid",
  physicsAwareness: {
    enabled: true,
    gravity: "normal",
    materialBehavior: {
      fabric: "flowing",
      liquid: "splashing",
    },
    constraints: {
      gravity: true,
      fluidDynamics: true,
      momentum: true,
      weight: true,
      materialBehavior: true,
    },
  },
};

// ============================================================================
// Scenes with VEO 3 Expression Control
// ============================================================================

/**
 * Scene with expression control for anti-model-face.
 */
export const sceneWithExpression: Scene = {
  ...fullScene,
  id: "expression-scene-001",
  expressionControl: {
    primary: "focused concentration",
    microExpressions: [
      {
        type: "brow-furrow",
        intensity: "subtle",
        timing: "throughout",
      },
    ],
    eyeMovement: {
      direction: "down",
      behavior: "focused",
      description: "eyes focused intently on the cutting board",
    },
    bodyLanguage: {
      posture: "leaning",
      stance: "confident",
      gesture: "hands moving with precision",
    },
    antiModelFace: true,
    asymmetry: true,
  },
  emotionalArc: {
    startState: "calm and methodical",
    middleState: "building intensity",
    endState: "satisfied accomplishment",
    transitionType: "gradual",
    beats: ["initial focus", "concentration builds", "completion satisfaction"],
  },
};

// ============================================================================
// Scenes with VEO 3 Advanced Composition
// ============================================================================

/**
 * Scene with advanced composition and lens effects.
 */
export const sceneWithAdvancedComposition: Scene = {
  ...fullScene,
  id: "composition-scene-001",
  lensEffects: {
    type: "standard",
    depthOfField: "shallow",
    aperture: "f/2.8",
    bokehStyle: "creamy",
    focalLength: "85mm",
    distortion: "none",
    flare: false,
  },
  colorGrading: {
    palette: "warm-orange",
    shadowColor: "#2a1f1a",
    highlightColor: "#f5e6d3",
    saturation: "punchy",
    contrast: "medium",
    filmEmulation: "Kodak Portra 400",
  },
  advancedLighting: {
    setup: "three-point",
    keyLight: {
      direction: "left",
      temperature: "warm",
      temperatureKelvin: 3200,
      intensity: "medium",
    },
    fillLight: {
      ratio: "2:1",
      direction: "right side",
    },
    rimLight: true,
    rimLightColor: "#ffd700",
    atmosphericEffects: ["haze"],
    practicalLights: ["overhead kitchen lights", "under-cabinet LEDs"],
  },
  advancedComposition: {
    rule: "rule-of-thirds",
    subjectPlacement: "left third intersection",
    foregroundElement: "herbs in soft focus",
    backgroundElement: "kitchen equipment bokeh",
    depthLayers: 3,
  },
};

// ============================================================================
// Scenes with Platform Format
// ============================================================================

/**
 * Scene optimized for TikTok/Reels (vertical).
 */
export const verticalScene: Scene = {
  ...fullScene,
  id: "vertical-scene-001",
  platformFormat: {
    aspectRatio: "9:16",
    platform: "tiktok",
    safeZones: {
      top: 100,
      bottom: 150,
    },
    optimization: ["mobile-optimized", "hook-driven"],
  },
  shotSize: "MCU",
};

/**
 * Scene with selfie/POV specification.
 */
export const selfieScene: Scene = {
  ...fullScene,
  id: "selfie-scene-001",
  selfieSpec: {
    enabled: true,
    armPosition: "extended",
    armVisible: true,
    cameraShake: "subtle",
    eyeContact: true,
    filmLike: true,
    closingGesture: "thumbs up",
  },
  platformFormat: {
    aspectRatio: "9:16",
    platform: "instagram-reels",
  },
};

// ============================================================================
// Character Variation Scenes
// ============================================================================

/**
 * Scene with multiple character variations.
 */
export const multiCharacterScene: Scene = {
  ...fullScene,
  id: "multi-char-scene-001",
  character: "Chef Marco and Sous Chef Anna",
  characterVariations: {
    "Chef Marco": {
      expression: "teaching, patient",
      pose: "demonstrating technique",
      outfit: "white chef coat with rolled sleeves",
      accessories: "towel over shoulder",
    },
    "Sous Chef Anna": {
      expression: "attentive, eager to learn",
      pose: "watching closely, taking notes",
      outfit: "sous chef uniform with apron",
      accessories: "notebook and pen",
    },
  },
};

// ============================================================================
// Edge Case Scenes
// ============================================================================

/**
 * Scene with very long prompt (stress test).
 */
export const longPromptScene: Scene = {
  ...fullScene,
  id: "long-prompt-001",
  prompt: Array(50).fill("detailed description element").join(", ") +
    ", professional kitchen environment, 4K quality, cinematic lighting",
};

/**
 * Scene with special characters in text.
 */
export const specialCharsScene: Scene = {
  ...fullScene,
  id: "special-chars-001",
  description: "Chef says: \"Let's cook!\" — preparing the dish (50% complete)",
  prompt: "Chef's expression shows excitement & determination; background shows 100% real kitchen",
};

/**
 * Scene with empty optional fields.
 */
export const sparseScene: Scene = {
  ...minimalScene,
  id: "sparse-001",
  sequence: 1,
  negativePrompt: undefined,
  voice: undefined,
  characterVariations: undefined,
  video: undefined,
  image: undefined,
  audio: undefined,
  dialogue: undefined,
};

// ============================================================================
// Scene Collections
// ============================================================================

/**
 * All scene fixtures.
 */
export const allScenes: Scene[] = [
  minimalScene,
  sequencedScene,
  fullScene,
  videoScene,
  imageScene,
  sceneWithAudio,
  sceneWithDialogue,
  sceneWithEnhancedCamera,
  sceneWithExpression,
  sceneWithAdvancedComposition,
  verticalScene,
  selfieScene,
  multiCharacterScene,
  longPromptScene,
  specialCharsScene,
  sparseScene,
];

/**
 * Scenes with VEO 3 features.
 */
export const veo3Scenes: Scene[] = [
  sceneWithAudio,
  sceneWithDialogue,
  sceneWithEnhancedCamera,
  sceneWithExpression,
  sceneWithAdvancedComposition,
  verticalScene,
  selfieScene,
];

/**
 * Generate a sequence of connected scenes.
 */
export function createSceneSequence(count: number): Scene[] {
  return Array.from({ length: count }, (_, i) => ({
    ...fullScene,
    id: `sequence-scene-${i + 1}`,
    sequence: i + 1,
    description: `Scene ${i + 1} of ${count}: Continuous action`,
    video: i > 0 ? {
      ...videoScene.video!,
      continuity: {
        previousSceneId: `sequence-scene-${i}`,
        nextSceneId: i < count - 1 ? `sequence-scene-${i + 2}` : undefined,
        matchAction: true,
        matchColor: true,
      },
    } : videoScene.video,
  }));
}
