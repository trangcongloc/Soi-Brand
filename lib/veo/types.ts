/**
 * VEO Pipeline - TypeScript interfaces
 */

// ============================================================================
// Scene Types
// ============================================================================

export interface StyleObject {
  genre: string;
  art_movement: string;
  medium: string;
  palette: string;
  color_temperature: string;
  contrast: string;
  texture: string;
  brushwork_or_line: string;
  rendering_engine: string;
  camera_lens: string;
  focal_length: string;
  depth_of_field: string;
  film_stock_or_profile: string;
  grain: string;
  noise_reduction: string;
  post_processing: string;
  composition_style: string;
  mood: string;
  lighting_style: string;
}

export interface VisualSpecs {
  primary_subject: string;
  environment: string;
  key_details: string;
}

export interface Lighting {
  mood: string;
  source: string;
  shadows: string;
}

export interface Composition {
  angle: string;
  framing: string;
  focus: string;
}

export interface Technical {
  quality: string;
  colors: string;
}

export interface Scene {
  // === Identity (for sequencing) ===
  id?: string;                    // Unique scene identifier
  sequence?: number;              // Order in sequence (1, 2, 3...)

  // === Media Type (NEW) ===
  mediaType?: MediaType;          // "image" | "video" - Default: "image" for backward compat

  // === Content (existing) ===
  description: string;
  object: string;
  character: string;
  style: StyleObject;
  visual_specs: VisualSpecs;
  lighting: Lighting;
  composition: Composition;
  technical: Technical;
  prompt: string;
  negativePrompt?: string; // Elements to avoid in generation
  voice?: string; // Optional voice narration

  // === Character skeleton system - scene-specific variations ===
  characterVariations?: {
    [characterName: string]: {
      outfit?: string;       // "now wearing casual clothes"
      accessories?: string;  // "wearing gloves, holding knife"
      expression?: string;   // "smiling", "angry"
      pose?: string;         // "sitting", "leaning on counter"
      injuries?: string;     // "bandaged hand"
    };
  };

  // === Image-Specific Settings (NEW) ===
  image?: ImageSettings;

  // === Video-Specific Settings (NEW) ===
  video?: VideoSettings;

  // === Platform Hints (NEW) ===
  platformHints?: PlatformHints;
}

// ============================================================================
// Character Skeleton System
// ============================================================================

/**
 * Fixed character attributes that never change across scenes.
 * Used to maintain consistency for recurring characters.
 */
export interface CharacterSkeleton {
  name: string;              // "Chef Marco"
  gender: string;            // "male"
  age: string;               // "40s"
  ethnicity: string;         // "Italian, olive skin"
  bodyType: string;          // "tall, stocky build"
  faceShape: string;         // "square jaw, prominent nose"
  hair: string;              // "salt-and-pepper, short, slicked back"
  facialHair?: string;       // "trimmed goatee"
  distinctiveFeatures?: string; // "scar on left cheek, gold tooth"
  baseOutfit: string;        // "white chef coat, black apron"
  firstAppearance?: string;  // "0:15" - timestamp of first appearance
}

/**
 * Result from Phase 1: Character extraction from video.
 * Characters are identified BEFORE scene generation to ensure consistency.
 */
export interface CharacterExtractionResult {
  characters: CharacterSkeleton[];
  background: string;  // Main environment/setting description
}

/**
 * Per-scene changes for a character (temporary state).
 */
export interface CharacterVariation {
  outfit?: string;       // "now wearing casual clothes"
  accessories?: string;  // "wearing gloves, holding knife"
  expression?: string;   // "smiling", "angry"
  pose?: string;         // "sitting", "leaning on counter"
  injuries?: string;     // "bandaged hand"
}

// ============================================================================
// Character Registry
// ============================================================================

/**
 * Registry of all characters found in the video.
 * Maps character name to either:
 * - Legacy: string description (for backward compatibility)
 * - New: CharacterSkeleton object (for skeleton system)
 */
export interface CharacterRegistry {
  [characterName: string]: string | CharacterSkeleton;
}

// ============================================================================
// Time Range for Batched Processing
// ============================================================================

export interface TimeRange {
  start: number;
  end: number;
  range: string;
  sceneCount: number;
}

/**
 * Batch info for direct video-to-scenes processing.
 * Used to tell AI which segment of the video to analyze.
 */
export interface DirectBatchInfo {
  batchNum: number;         // Current batch number (0-indexed)
  totalBatches: number;     // Total number of batches
  startSeconds: number;     // Start time in seconds
  endSeconds: number;       // End time in seconds
  startTime: string;        // Formatted start time (MM:SS)
  endTime: string;          // Formatted end time (MM:SS)
  sceneCount: number;       // Target scenes for this batch
}

// ============================================================================
// VEO Generation Modes
// ============================================================================

export type VeoMode = "direct" | "hybrid";

export type VeoWorkflow = "url-to-script" | "script-to-scenes" | "url-to-scenes";

export type VoiceLanguage =
  | "no-voice"
  | "english"
  | "vietnamese"
  | "spanish"
  | "french"
  | "german"
  | "japanese"
  | "korean"
  | "chinese";

// ============================================================================
// Script Types (for Step 1 and Step 2)
// ============================================================================

export interface ScriptSegment {
  timestamp: string;
  content: string;
  speaker?: string;
  action?: string;
  emotion?: string;
}

export interface GeneratedScript {
  title: string;
  duration: string;
  language: string;
  segments: ScriptSegment[];
  summary: string;
  characters: string[];
  settings: string[];
  rawText: string;
}

// ============================================================================
// VEO Request/Response
// ============================================================================

export interface VeoGenerateRequest {
  workflow: VeoWorkflow;
  videoUrl?: string;
  scriptText?: string;
  mode: VeoMode;
  sceneCount?: number;
  batchSize?: number;
  voice?: VoiceLanguage;
  resumeJobId?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  // Resume parameters
  resumeFromBatch?: number;
  existingScenes?: Scene[];
  existingCharacters?: CharacterRegistry;
  // Phase 0: Color profile extraction
  extractColorProfile?: boolean; // Default: true
  existingColorProfile?: CinematicProfile; // For resume
  // Media type: image vs video generation
  mediaType?: MediaType; // Default: "video"
}

export interface VeoScriptEvent {
  event: "script";
  data: {
    script: GeneratedScript;
  };
}

export interface VeoProgressEvent {
  event: "progress";
  data: {
    batch: number;
    total: number;
    scenes: number;
    message?: string;
  };
}

export interface VeoCharacterEvent {
  event: "character";
  data: {
    name: string;
    description: string;
  };
}

export interface VeoCompleteEvent {
  event: "complete";
  data: {
    jobId: string;
    scenes: Scene[];
    characterRegistry: CharacterRegistry;
    summary: VeoJobSummary;
    script?: GeneratedScript; // Script for caching (only in url-to-scenes workflow)
    colorProfile?: CinematicProfile; // Phase 0: Cinematic color profile
  };
}

export interface VeoErrorEvent {
  event: "error";
  data: {
    type: VeoErrorType;
    message: string;
    retryable: boolean;
    debug?: {
      batch?: number;
      status?: number;
      originalMessage?: string;
      apiError?: string;
      scenesCompleted?: number;
    };
  };
}

export type VeoSSEEvent =
  | VeoProgressEvent
  | VeoCharacterEvent
  | VeoCompleteEvent
  | VeoErrorEvent
  | VeoScriptEvent
  | VeoColorProfileEvent;

// ============================================================================
// Error Types
// ============================================================================

export type VeoErrorType =
  | "INVALID_URL"
  | "GEMINI_API_ERROR"
  | "GEMINI_QUOTA"
  | "GEMINI_RATE_LIMIT"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "TIMEOUT"
  | "UNKNOWN_ERROR";

// ============================================================================
// Job & Progress Tracking
// ============================================================================

export interface VeoJobSummary {
  mode: VeoMode;
  youtubeUrl: string;
  videoId: string;
  targetScenes: number;
  actualScenes: number;
  batches?: number;
  batchSize?: number;
  voice: string;
  charactersFound: number;
  characters: string[];
  processingTime: string;
  createdAt: string;
}

export interface VeoProgress {
  jobId: string;
  mode: VeoMode;
  youtubeUrl: string;
  videoId: string;
  sceneCount: number;
  batchSize: number;
  voiceLang: VoiceLanguage;
  totalBatches: number;
  completedBatches: number;
  characterRegistry: CharacterRegistry;
  scenes: Scene[];
  lastError?: string;
  lastUpdated: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  // Resume support
  scriptText?: string;
}

// ============================================================================
// Resume Data
// ============================================================================

export interface VeoResumeData {
  jobId: string;
  videoUrl: string;
  scriptText: string;
  mode: VeoMode;
  sceneCount: number;
  batchSize: number;
  voice: VoiceLanguage;
  completedBatches: number;
  totalBatches: number;
  existingScenes: Scene[];
  existingCharacters: CharacterRegistry;
}

// ============================================================================
// Cached VEO Job
// ============================================================================

export type VeoJobStatus = "completed" | "failed" | "partial";

export interface CachedVeoJob {
  jobId: string;
  videoId: string;
  videoUrl: string;
  summary: VeoJobSummary;
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  timestamp: number;
  script?: GeneratedScript; // Cached script for regeneration
  colorProfile?: CinematicProfile; // Phase 0: Cached color profile
  status: VeoJobStatus; // Job completion status
  error?: {
    message: string;
    type: VeoErrorType;
    failedBatch?: number; // Which batch failed (for retry)
    totalBatches?: number; // Total batches in the job
    retryable: boolean; // Whether the job can be retried
  };
  // Resume data for partial/failed jobs
  resumeData?: {
    completedBatches: number;
    existingScenes: Scene[];
    existingCharacters: CharacterRegistry;
    workflow: "url-to-script" | "script-to-scenes" | "url-to-scenes";
    mode: VeoMode;
    batchSize: number;
    sceneCount: number;
    voice: VoiceLanguage;
    colorProfile?: CinematicProfile; // Phase 0: For resume
  };
}

export interface CachedVeoJobInfo {
  jobId: string;
  videoId: string;
  videoUrl: string;
  sceneCount: number;
  charactersFound: number;
  mode: VeoMode;
  voice: string;
  timestamp: number;
  createdAt: string;
  hasScript: boolean; // Whether script is cached for regeneration
  status: VeoJobStatus; // Job completion status
  error?: {
    message: string;
    type: VeoErrorType;
    failedBatch?: number;
    totalBatches?: number;
    retryable: boolean;
  };
}

// ============================================================================
// Gemini API Types
// ============================================================================

export interface GeminiRequestBody {
  contents: GeminiContent[];
  systemInstruction?: {
    parts: Array<{ text: string }>;
    role?: string;
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: Record<string, unknown>;
  };
}

export interface GeminiContent {
  parts: GeminiPart[];
  role?: string;
}

export type GeminiPart =
  | { text: string }
  | { fileData: { fileUri: string; mimeType: string } };

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ============================================================================
// Gemini Error
// ============================================================================

export interface GeminiApiError extends Error {
  status?: number;
  response?: {
    error?: {
      message?: string;
      code?: number;
    };
    raw?: string;
  };
}

// ============================================================================
// Deduplication Types
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
// VEO Settings (extended)
// ============================================================================

/**
 * Extended VEO settings including deduplication, description parsing,
 * continuity mode, and other quality improvements.
 */
export interface VeoSettings {
  // Deduplication settings
  deduplication: DeduplicationConfig;

  // Description parsing (Phase 2)
  useVideoDescription: boolean; // Default: true
  useVideoChapters: boolean; // Default: true

  // Continuity settings (Phase 3)
  continuityMode: "last-scene" | "full-history" | "summary"; // Default: full-history
  continuitySceneLimit: number; // If summary mode, how many recent scenes to include (default: 10)

  // Timestamp handling (Phase 4)
  preserveCookingTimings: boolean; // Default: true

  // Scene count flexibility (Phase 5)
  allowFewerScenes: boolean; // Default: true
  minSceneCountRatio: number; // Default: 0.7 (70% of target)

  // Color profile extraction (Phase 0)
  extractColorProfile: boolean; // Default: true
}

// ============================================================================
// Phase 0: Cinematic Color Profile Extraction
// ============================================================================

/**
 * Color entry with hex and description
 */
export interface ColorEntry {
  hex: string;        // "#FF5733"
  name: string;       // "warm coral"
  usage: string;      // "accent", "background", "skin tones"
}

/**
 * Full cinematic profile extracted from video
 * Used to ensure consistent color values across all generated scenes
 */
export interface CinematicProfile {
  dominantColors: ColorEntry[];  // 5-8 colors
  colorTemperature: {
    category: "warm" | "cool" | "neutral" | "mixed";
    kelvinEstimate: number;
    description: string;
  };
  contrast: {
    level: "low" | "medium" | "high" | "extreme";
    style: string;
    blackPoint: string;
    whitePoint: string;
  };
  shadows: {
    color: string;
    density: string;
    falloff: string;
  };
  highlights: {
    color: string;
    handling: string;
    bloom: boolean;
  };
  filmStock: {
    suggested: string;
    characteristics: string;
    digitalProfile?: string;
  };
  mood: {
    primary: string;
    atmosphere: string;
    emotionalTone: string;
  };
  grain: {
    amount: "none" | "subtle" | "moderate" | "heavy";
    type: string;
    pattern: string;
  };
  postProcessing: {
    colorGrade: string;
    saturation: string;
    vignettePresent: boolean;
    splitToning?: {
      shadows: string;
      highlights: string;
    };
  };
}

/**
 * Result from Phase 0: Color profile extraction from video
 */
export interface ColorProfileExtractionResult {
  profile: CinematicProfile;
  confidence: number;  // 0.0 to 1.0
}

/**
 * SSE event for color profile extraction completion
 */
export interface VeoColorProfileEvent {
  event: "colorProfile";
  data: {
    profile: CinematicProfile;
    confidence: number;
  };
}

// ============================================================================
// Media Type: Image vs Video Generation
// ============================================================================

/**
 * Media type for scene generation - determines output optimization
 */
export type MediaType = "image" | "video";

/**
 * Image-specific settings for still image generation (Midjourney, DALL-E, Flux)
 */
export interface ImageSettings {
  aspectRatio: "1:1" | "4:3" | "16:9" | "9:16" | "21:9" | "3:2";
  resolution?: "sd" | "hd" | "4k" | "8k";
  styleWeight?: number;         // 0-100, how much style influences
  detailLevel?: "low" | "medium" | "high" | "ultra";
}

/**
 * Camera movement description for video generation
 */
export interface CameraMovement {
  type: "static" | "pan" | "tilt" | "dolly" | "crane" | "handheld" | "orbital" | "zoom" | "tracking";
  direction?: "left" | "right" | "up" | "down" | "in" | "out" | "clockwise" | "counterclockwise";
  intensity?: "subtle" | "moderate" | "dynamic";
  path?: string;              // Natural language path description
}

/**
 * Subject motion description for video generation
 */
export interface SubjectMotion {
  primary: string;            // "Chef walks left to right"
  secondary?: string;         // "Steam rises from pot"
  background?: string;        // "Trees sway gently"
}

/**
 * Video continuity tracking between scenes
 */
export interface VideoContinuity {
  previousSceneId?: string;
  nextSceneId?: string;
  matchAction?: boolean;      // Continue motion from previous
  matchColor?: boolean;       // Match color grade
  notes?: string;
}

/**
 * Video-specific settings for video generation (VEO, Sora, Runway)
 */
export interface VideoSettings {
  duration: number;             // Seconds (e.g., 4, 6, 8)
  fps?: 24 | 30 | 60;
  speed?: "normal" | "slow-motion" | "timelapse";
  cameraMovement: CameraMovement;
  subjectMotion?: SubjectMotion;
  transitionIn?: "cut" | "fade" | "dissolve" | "wipe" | "zoom";
  transitionOut?: "cut" | "fade" | "dissolve" | "wipe" | "zoom";
  continuity?: VideoContinuity;
  audioCues?: string[];         // ["fire crackling", "knife on wood"]
}

/**
 * Platform-specific hints for generation
 */
export interface PlatformHints {
  // Image generation platforms
  midjourney?: {
    version?: "v5" | "v6" | "niji";
    stylize?: number;             // 0-1000
    chaos?: number;               // 0-100
    weird?: number;               // 0-3000
  };
  dalle?: {
    style?: "vivid" | "natural";
    quality?: "standard" | "hd";
  };
  flux?: {
    guidance?: number;            // CFG scale
    steps?: number;
  };

  // Video generation platforms
  veo?: {
    model?: "veo-001" | "veo-002";
    aspectRatio?: string;
  };
  sora?: {
    duration?: number;
    resolution?: string;
  };
  runway?: {
    model?: "gen2" | "gen3";
    motion?: number;              // 1-10
  };
}
