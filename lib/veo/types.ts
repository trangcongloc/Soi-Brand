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

  // ============================================================================
  // VEO 3 PROMPTING GUIDE - Enhanced Scene Fields
  // ============================================================================

  // === VEO 3: Audio System ===
  audio?: AudioSpec;

  // === VEO 3: Dialogue System ===
  dialogue?: DialogueSpec[];
  textOverlayPrevention?: TextOverlayPrevention;

  // === VEO 3: Enhanced Camera ===
  enhancedCamera?: EnhancedCameraPosition;
  movementQuality?: MovementQuality;
  physicsAwareness?: PhysicsSpec;

  // === VEO 3: Expression Control ===
  expressionControl?: ExpressionControl;
  emotionalArc?: EmotionalArc;
  sceneProgression?: SceneProgression;

  // === VEO 3: Advanced Composition ===
  lensEffects?: LensEffects;
  colorGrading?: ColorGrading;
  advancedLighting?: AdvancedLighting;
  advancedComposition?: AdvancedComposition;

  // === VEO 3: Platform & Quality ===
  platformFormat?: PlatformFormat;
  selfieSpec?: SelfieSpec;
  shotSize?: ShotSize;
  qualityScore?: PromptQualityScore;
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

/**
 * Granular audio layer controls for VEO 3 generation.
 * Each layer can be independently toggled ON/OFF.
 * When OFF, the prompt explicitly tells Gemini NOT to generate that layer.
 */
export interface AudioSettings {
  voiceLanguage: VoiceLanguage;
  music: boolean;
  soundEffects: boolean;
  environmentalAudio: boolean;
}

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
    failedBatch?: number; // Which batch failed (always sent for batch errors)
    totalBatches?: number; // Total batches in the job (always sent for batch errors)
    scenesCompleted?: number; // Number of scenes completed before failure
    debug?: {
      status?: number;
      originalMessage?: string;
      apiError?: string;
    };
  };
}

// ============================================================================
// Gemini API Logging
// ============================================================================

/**
 * Log entry for a single Gemini API call.
 * Captures full request/response for debugging and phase-level caching.
 */
export interface GeminiLogEntry {
  id: string;
  timestamp: string;
  phase: "phase-0" | "phase-1" | "phase-2";
  batchNumber?: number;
  status?: "pending" | "completed"; // "pending" = request sent, "completed" = response received
  request: {
    model: string;
    body: string; // Full JSON request body (stringified)
    promptLength: number;
    videoUrl?: string;
  };
  response: {
    success: boolean;
    finishReason?: string;
    body: string; // Full JSON response (stringified)
    responseLength: number;
    parsedItemCount?: number; // Number of scenes/characters parsed
    parsedSummary: string; // e.g. "10 scenes" or "3 characters, 92% confidence"
  };
  timing: { durationMs: number; retries: number };
  tokens?: { prompt: number; candidates: number; total: number };
  error?: { type: string; message: string };
}

/**
 * Phase-level cache for resumable VEO jobs.
 * Stores results from each phase individually so resume can skip completed phases.
 */
export interface VeoPhaseCache {
  jobId: string;
  videoUrl: string;
  timestamp: number;
  phase0?: { colorProfile: CinematicProfile; confidence: number };
  phase1?: {
    characters: CharacterSkeleton[];
    background: string;
    registry: CharacterRegistry;
  };
  phase2Batches: Record<
    number,
    { scenes: Scene[]; characters: CharacterRegistry }
  >;
  logs: GeminiLogEntry[];
  settings: {
    mode: VeoMode;
    sceneCount: number;
    batchSize: number;
    workflow: VeoWorkflow;
  };
}

// ============================================================================
// Log SSE Event
// ============================================================================

export interface VeoLogEvent {
  event: "log";
  data: GeminiLogEntry;
}

export interface VeoLogUpdateEvent {
  event: "logUpdate";
  data: GeminiLogEntry;
}

export interface VeoBatchCompleteEvent {
  event: "batchComplete";
  data: {
    batchNumber: number;
    scenes: Scene[];
    characters: CharacterRegistry;
  };
}

export type VeoSSEEvent =
  | VeoProgressEvent
  | VeoCharacterEvent
  | VeoCompleteEvent
  | VeoErrorEvent
  | VeoScriptEvent
  | VeoColorProfileEvent
  | VeoLogEvent
  | VeoLogUpdateEvent
  | VeoBatchCompleteEvent;

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
  // Job status (for failed/partial jobs)
  status?: VeoJobStatus;
  error?: {
    message: string;
    type: VeoErrorType;
    failedBatch?: number;
    totalBatches?: number;
    retryable: boolean;
  };
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
  logs?: GeminiLogEntry[]; // Cached log entries for scene request/response display
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
    // Extended fields for full settings restoration
    useVideoTitle?: boolean;
    useVideoDescription?: boolean;
    useVideoChapters?: boolean;
    useVideoCaptions?: boolean;
    negativePrompt?: string;
    extractColorProfile?: boolean;
    mediaType?: MediaType;
    autoSceneCount?: boolean;
    startTime?: string;
    endTime?: string;
    selfieMode?: boolean;
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
  | {
      fileData: { fileUri: string; mimeType: string };
      videoMetadata?: { startOffset: string; endOffset: string };
    };

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
// VEO Settings (extended)
// ============================================================================

/**
 * Extended VEO settings including description parsing,
 * continuity mode, and other quality improvements.
 */
export interface VeoSettings {
  // Video metadata options (Phase 2)
  useVideoTitle: boolean; // Default: true
  useVideoDescription: boolean; // Default: true
  useVideoChapters: boolean; // Default: true
  useVideoCaptions: boolean; // Default: true

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
 * Enhanced color entry with semantic name and mood/psychology metadata
 */
export interface EnrichedColorEntry extends ColorEntry {
  semanticName: string;        // "deep ocean mystery blue"
  moods: string[];             // ["mysterious", "professional", "cold"]
  temperature: "warm" | "cool" | "neutral";
  psychologyNotes?: string;    // "Evokes trust, depth, mystery"
  confidence?: number;         // 0-1: mapping confidence score
}

/**
 * Full cinematic profile extracted from video
 * Used to ensure consistent color values across all generated scenes
 */
export interface CinematicProfile {
  dominantColors: EnrichedColorEntry[];  // 5-8 colors with semantic names and moods
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

// ============================================================================
// VEO 3 PROMPTING GUIDE - Audio System
// ============================================================================

/**
 * Environmental audio specification for ambient sounds
 * Prevents audio hallucinations by explicitly specifying expected sounds
 */
export interface EnvironmentalAudio {
  ambiance: string;           // "busy city street", "quiet forest", "kitchen ambiance"
  intensity: "subtle" | "moderate" | "prominent";
  spatialPosition?: string;   // "surrounding", "distant left", "close right"
}

/**
 * Music specification for background music
 */
export interface MusicSpec {
  mood: string;               // "tense", "uplifting", "melancholic", "energetic"
  genre?: string;             // "cinematic orchestral", "lo-fi beats", "jazz piano"
  volume: "background" | "prominent" | "featured";
  tempo?: "slow" | "moderate" | "fast";
  instruments?: string;       // "strings and piano", "acoustic guitar"
}

/**
 * Sound effect synchronized to action
 */
export interface SoundEffect {
  sound: string;              // "footsteps on gravel", "door slamming"
  trigger: string;            // "as character walks", "when entering room"
  intensity?: "subtle" | "moderate" | "prominent";
}

/**
 * Audio hallucination prevention specification
 * Explicitly specify what SHOULD and should NOT be heard
 */
export interface AudioHallucinationPrevention {
  expectedAmbient: string[];      // ["quiet office", "AC hum", "keyboard typing"]
  expectedEffects: string[];      // ["marker squeak", "paper rustling"]
  preventedSounds: string[];      // ["audience laughter", "applause", "background music"]
  roomTone?: "quiet" | "moderate" | "busy";
  acoustics?: "intimate" | "room" | "hall" | "outdoor";
}

/**
 * Complete audio specification for VEO 3
 */
export interface AudioSpec {
  environmental?: EnvironmentalAudio;
  music?: MusicSpec;
  soundEffects?: SoundEffect[];
  hallucinationPrevention?: AudioHallucinationPrevention;
  negations?: string[];       // ["unwanted laughter", "applause", "crowd noise"]
}

// ============================================================================
// VEO 3 PROMPTING GUIDE - Dialogue System
// ============================================================================

/**
 * Dialogue specification with VEO 3 colon format
 * Uses "Character says: 'dialogue'" syntax to prevent subtitles
 */
export interface DialogueSpec {
  character: string;          // Character name
  line: string;               // The dialogue text (max 12-15 words for 8-sec rule)
  delivery?: string;          // "whispered", "shouted", "with conviction"
  phonetic?: string;          // For mispronunciation fixes: "foh-fur" for "Fofur"
  emotion?: string;           // "warm enthusiasm", "menacing intensity"
  timing?: "start" | "middle" | "end";  // When in scene dialogue occurs
}

/**
 * Text overlay prevention settings
 */
export interface TextOverlayPrevention {
  noSubtitles: boolean;
  noOnScreenText: boolean;
  noCaptions: boolean;
  noWatermarks: boolean;
  method?: "colon-format" | "explicit-negation" | "multiple-negatives";
}

// ============================================================================
// VEO 3 PROMPTING GUIDE - Enhanced Camera System
// ============================================================================

/**
 * Camera height options
 */
export type CameraHeight = "ground-level" | "eye-level" | "overhead" | "aerial";

/**
 * Camera distance options
 */
export type CameraDistance = "intimate" | "close" | "medium" | "far" | "extreme";

/**
 * Enhanced camera position with VEO 3 "(thats where the camera is)" syntax
 */
export interface EnhancedCameraPosition {
  type: CameraMovement["type"];
  direction?: CameraMovement["direction"];
  intensity?: CameraMovement["intensity"];

  // VEO 3: Precise positioning with "(thats where the camera is)" syntax
  position?: string;          // "at counter level", "behind interviewer"
  height?: CameraHeight;
  distance?: CameraDistance;

  // VEO 3: Timing controls
  movementTiming?: {
    startAt?: number;         // Seconds into scene
    duration?: number;        // Duration of movement
    easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  };

  // Generate "(thats where the camera is)" phrase
  positionPhrase?: string;    // Full phrase for prompt injection
}

/**
 * Movement quality keywords for natural motion
 */
export type MovementQuality =
  | "natural"
  | "fluid"
  | "graceful"
  | "energetic"
  | "dynamic"
  | "deliberate"
  | "swift"
  | "slow-motion"
  | "mechanical"
  | "confident";

/**
 * Physics specifications for realistic movement
 */
export interface PhysicsSpec {
  enabled: boolean;
  gravity?: "normal" | "low" | "zero" | "heavy";
  materialBehavior?: {
    fabric?: "flowing" | "stiff" | "billowing";
    hair?: "static" | "windswept" | "bouncing";
    liquid?: "splashing" | "dripping" | "pouring";
    smoke?: "rising wisps" | "dispersing naturally";
  };
  constraints?: {
    gravity: boolean;           // "realistic physics governing all actions"
    fluidDynamics: boolean;     // "natural fluid dynamics"
    momentum: boolean;          // "authentic momentum conservation"
    weight: boolean;            // "proper weight and balance"
    materialBehavior: boolean;  // "realistic material behavior"
  };
  customPhysics?: string;       // Custom physics description
}

// ============================================================================
// VEO 3 PROMPTING GUIDE - Expression Control
// ============================================================================

/**
 * Micro-expression types for natural, non-model-face expressions
 */
export interface MicroExpression {
  type: "eye-twitch" | "lip-quiver" | "brow-furrow" | "nostril-flare" | "jaw-tighten" | "custom";
  customDescription?: string;
  intensity: "barely-visible" | "subtle" | "noticeable";
  timing?: "start" | "middle" | "end" | "throughout";
}

/**
 * Eye movement and behavior
 */
export interface EyeMovement {
  direction?: "up" | "down" | "left" | "right" | "camera" | "away";
  behavior?: "narrow" | "squint" | "wide" | "darting" | "focused";
  description?: string;       // "eyes squint thoughtfully"
}

/**
 * Body language specification
 */
export interface BodyLanguage {
  posture?: "upright" | "slouched" | "leaning" | "rigid" | "relaxed";
  stance?: "open" | "closed" | "defensive" | "confident";
  gesture?: string;           // "gestures toward charts", "crosses arms"
}

/**
 * Complete expression control for anti-model-face technique
 */
export interface ExpressionControl {
  primary: string;            // Main emotion: "confident", "nervous"
  microExpressions?: MicroExpression[];
  eyeMovement?: EyeMovement;
  bodyLanguage?: BodyLanguage;
  antiModelFace?: boolean;    // Prevent flat "model face" look
  asymmetry?: boolean;        // Natural, unstaged expression with slight asymmetry
}

/**
 * Emotional arc for "This Then That" progression
 */
export interface EmotionalArc {
  startState: string;         // "calm and composed", "confused"
  middleState?: string;       // "gradually becoming confident"
  endState: string;           // "overwhelmed with joy", "satisfied accomplishment"
  transitionType?: "gradual" | "sudden" | "building";
  beats?: string[];           // Intermediate emotional beats
}

/**
 * Scene progression for emotional/action sequences within single scene
 */
export interface SceneProgression {
  emotionalProgression?: EmotionalArc;

  // Action sequence within scene
  actionProgression?: {
    start: string;           // "hesitates at door"
    middle?: string;         // "takes deep breath"
    end: string;             // "pushes open with resolve"
  };

  // Camera progression within scene
  cameraProgression?: {
    start: string;           // "wide establishing"
    transition?: string;     // "at 3-second mark"
    end: string;             // "close-up on expression"
  };
}

// ============================================================================
// VEO 3 PROMPTING GUIDE - Advanced Composition
// ============================================================================

/**
 * Lens types for different visual effects
 */
export type LensType =
  | "standard"
  | "wide-angle"
  | "telephoto"
  | "macro"
  | "fish-eye"
  | "anamorphic";

/**
 * Lens effects specification
 */
export interface LensEffects {
  type?: LensType;
  depthOfField?: "shallow" | "medium" | "deep" | "rack-focus" | "soft-focus";
  aperture?: string;              // "f/1.4", "f/2.8", "f/8"
  bokehStyle?: "smooth" | "busy" | "swirly" | "hexagonal" | "creamy";
  focalLength?: string;           // "24mm", "50mm", "85mm", "200mm"
  distortion?: "none" | "barrel" | "pincushion";
  flare?: boolean;                // Enable lens flare
  flareStyle?: "anamorphic" | "circular" | "natural" | "jj-abrams";
}

/**
 * Color palette types
 */
export type ColorPaletteType =
  | "auto"
  | "monochromatic"
  | "vibrant"
  | "pastel"
  | "desaturated"
  | "sepia"
  | "cool-blue"
  | "warm-orange"
  | "teal-orange"      // Hollywood blockbuster
  | "noir";            // Black and white

/**
 * Color grading specification
 */
export interface ColorGrading {
  palette?: ColorPaletteType;

  // Split toning
  shadowColor?: string;           // Hex color for shadows: "#1a3a5c"
  highlightColor?: string;        // Hex color for highlights: "#d4a574"

  // Adjustments
  saturation?: "muted" | "normal" | "punchy" | "oversaturated";
  contrast?: "low" | "medium" | "high" | "extreme";

  // Selective color
  selectiveColorEmphasis?: string; // "red rose", "blue eyes"

  // Film emulation
  filmEmulation?: string;          // "Kodak Portra 400", "Fuji Superia", "Kodachrome"
}

/**
 * Professional lighting setups
 */
export type LightingSetup =
  | "auto"
  | "three-point"
  | "rembrandt"
  | "butterfly"
  | "split"
  | "chiaroscuro"
  | "golden-hour"
  | "blue-hour"
  | "neon"
  | "natural"
  | "practical";

/**
 * Advanced lighting specification
 */
export interface AdvancedLighting {
  setup?: LightingSetup;

  // Key light
  keyLight?: {
    direction: "left" | "right" | "front" | "back" | "above";
    temperature?: "warm" | "neutral" | "cool";
    temperatureKelvin?: number;   // 3200K (tungsten), 5600K (daylight)
    intensity?: "soft" | "medium" | "hard";
  };

  // Fill light
  fillLight?: {
    ratio?: string;               // "2:1", "4:1", "8:1"
    direction?: string;
  };

  // Accent/rim light
  rimLight?: boolean;
  rimLightColor?: string;

  // Atmospheric
  atmosphericEffects?: ("haze" | "fog" | "dust" | "rain" | "snow")[];
  practicalLights?: string[];     // ["desk lamp", "neon sign", "candles"]
}

/**
 * Composition rules/techniques
 */
export type CompositionRule =
  | "rule-of-thirds"
  | "golden-ratio"
  | "symmetry"
  | "leading-lines"
  | "frame-within-frame"
  | "negative-space"
  | "diagonal"
  | "centered";

/**
 * Advanced composition specification
 */
export interface AdvancedComposition {
  rule?: CompositionRule;
  subjectPlacement?: string;      // "left third intersection", "center"
  foregroundElement?: string;     // Element in foreground for depth
  backgroundElement?: string;     // Background detail
  depthLayers?: number;           // 2-5 layers of depth
}

// ============================================================================
// VEO 3 PROMPTING GUIDE - Platform & Format
// ============================================================================

/**
 * Enhanced platform format specification
 */
export interface PlatformFormat {
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5" | "21:9";
  platform?: "youtube" | "tiktok" | "instagram-reels" | "youtube-shorts" | "instagram-feed";
  safeZones?: {
    top?: number;             // Pixels to keep clear
    bottom?: number;
  };
  optimization?: string[];    // ["mobile-optimized", "hook-driven"]
}

/**
 * Selfie/POV mode specification
 */
export interface SelfieSpec {
  enabled: boolean;
  armPosition?: "extended" | "close";
  armVisible?: boolean;           // "arm is clearly visible in frame"
  cameraShake?: "none" | "subtle" | "natural";
  eyeContact?: boolean;           // "occasionally looking into camera"
  filmLike?: boolean;             // "slightly grainy, looks very film-like"
  closingGesture?: string;        // "thumbs up", "wave", "smile"
}

/**
 * Vertical video workaround specification
 */
export interface VerticalVideoSpec {
  nativeAspect: "16:9";           // Veo 3 only supports 16:9
  targetAspect: "9:16";
  reframeTool?: "luma-reframe" | "manual";
  safeZones: {
    top: number;
    bottom: number;
  };
}

/**
 * Subtitle prevention methods
 */
export interface SubtitlePrevention {
  method: "colon-format" | "explicit-negation" | "multiple-negatives";
  // Method implementations:
  // 1. Colon format: "says: 'dialogue'" (prevents subtitles)
  // 2. Explicit: Add "(no subtitles)"
  // 3. Multiple: "No subtitles. No subtitles! No on-screen text."
}

// ============================================================================
// VEO 3 PROMPTING GUIDE - Quality Systems
// ============================================================================

/**
 * Multi-shot sequence planning with shot size hierarchy
 */
export type ShotSize =
  | "EWS"   // Extreme Wide Shot - environmental context
  | "WS"    // Wide Shot - full body + environment
  | "MWS"   // Medium Wide Shot - character + context
  | "MS"    // Medium Shot - waist up (standard)
  | "MCU"   // Medium Close-Up - focused attention
  | "CU"    // Close-Up - emotional intensity
  | "ECU";  // Extreme Close-Up - critical detail

/**
 * Multi-shot sequence specification
 */
export interface MultiShotSequence {
  shotSize: ShotSize;
  purpose: string;           // "establish environment", "show emotion"
  duration?: number;         // seconds
  transitionTo?: ShotSize;   // next shot in sequence
}

/**
 * Pre-generation quality checklist (10-point system)
 */
export interface QualityChecklist {
  characterDescription: boolean;    // 15+ attributes
  sceneDetails: boolean;            // 10+ elements
  cameraSpecs: boolean;             // shot/angle/movement
  lighting: boolean;                // professional setup
  audioDesign: boolean;             // hallucination prevention
  dialogue: boolean;                // tone + 8-sec rule
  negativePrompts: boolean;         // comprehensive
  technicalSpecs: boolean;          // broadcast quality
  brandCompliance?: boolean;        // optional
  eightSecondOptimization: boolean; // dialogue timing
}

/**
 * Quality level based on checklist completion
 */
export type QualityLevel = "master" | "professional" | "intermediate" | "basic";

/**
 * Prompt quality scoring
 */
export interface PromptQualityScore {
  level: QualityLevel;

  // Component scores (1-10)
  scores: {
    characterDescription: number;  // 1-10 (need 15+ attributes for 10)
    sceneDetails: number;          // 1-10 (need 10+ elements for 10)
    cameraSpecs: number;           // 1-10
    lightingSetup: number;         // 1-10
    audioDesign: number;           // 1-10
    dialogueQuality: number;       // 1-10
    negativePrompts: number;       // 1-10
  };

  // Prediction
  overallScore: number;            // 0-100
  generationSuccessRate: number;   // 0-100%
  optimizationSuggestions: string[];
}

// ============================================================================
// VEO 3 PROMPTING GUIDE - Enhanced Character Template
// ============================================================================

/**
 * Enhanced character template with 15+ attributes for consistency
 */
export interface EnhancedCharacterTemplate {
  // Identity (3 attributes)
  name: string;
  ethnicity: string;
  gender: string;

  // Physical (5 attributes)
  age: string;
  build: string;              // "slim", "athletic", "stocky"
  height: string;             // "tall", "medium", "short"
  hairDetails: string;        // color, style, length, texture
  eyeDetails: string;         // color, shape, expression

  // Facial (3 attributes)
  facialFeatures: string;     // shape, distinctive marks
  facialHair?: string;
  skinDetails?: string;

  // Clothing (2 attributes)
  clothingDescription: string;  // full outfit details
  accessories?: string;

  // Behavioral (2+ attributes)
  postureMannerisms: string;
  emotionalBaseline: string;
  distinctiveMarks?: string;
  voiceCharacteristics?: string;
}

// ============================================================================
// VEO 3 PROMPTING GUIDE - Template System
// ============================================================================

/**
 * Template categories for battle-tested prompts
 */
export type TemplateCategory =
  | "pov-vlog"           // Travel, lifestyle vlogs
  | "asmr"               // Macro, sensory content
  | "street-interview"   // Viral social media
  | "corporate"          // Professional presentations
  | "educational"        // Learning content
  | "product-demo"       // Commercial showcases
  | "horror-thriller"    // Genre-specific
  | "comedy"             // Entertainment
  | "documentary"        // Authentic storytelling
  | "fashion-beauty"     // Glamour content
  | "sports-action"      // Dynamic movement
  | "cinematic-drama";   // Narrative film

/**
 * Prompt template with placeholders
 */
export interface PromptTemplate {
  id: string;
  category: TemplateCategory;
  name: string;
  description: string;

  // Template structure with placeholders
  template: {
    subject: string;       // With [PLACEHOLDERS]
    action: string;
    scene: string;
    style: string;
    dialogue?: string;
    sounds: string;
    technical: string;
  };

  // Required variables
  variables: {
    name: string;
    description: string;
    examples: string[];
  }[];

  // Best practices for this template
  tips: string[];
}

// VEO 3 techniques are now integrated into base instructions (not optional toggles).
// Only selfieMode remains as a genuine shot-type toggle.

// ============================================================================
// VEO Form Settings Persistence
// ============================================================================

/**
 * Persisted VEO form preferences.
 * Per-video fields (url, workflow, scriptText, durationMode, startTime, endTime)
 * are NOT persisted — they change every session.
 */
export interface VeoFormSettings {
  // Core
  mode: VeoMode;
  autoSceneCount: boolean;
  sceneCount: number;
  batchSize: number;
  audio: AudioSettings;

  // Processing
  useVideoTitle: boolean;
  useVideoDescription: boolean;
  useVideoChapters: boolean;
  useVideoCaptions: boolean;
  extractColorProfile: boolean;
  mediaType: MediaType;

  // Prompting
  negativePrompt: string;

  // Selfie mode (genuine shot-type toggle — VEO 3 techniques are integrated by default)
  selfieMode: boolean;
}
