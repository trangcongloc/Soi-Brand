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
  description: string;
  object: string;
  character: string;
  style: StyleObject;
  visual_specs: VisualSpecs;
  lighting: Lighting;
  composition: Composition;
  technical: Technical;
  prompt: string;
  voice?: string; // Optional voice narration
}

// ============================================================================
// Character Registry
// ============================================================================

export interface CharacterRegistry {
  [characterName: string]: string; // Full character description
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

// ============================================================================
// VEO Generation Modes
// ============================================================================

export type VeoMode = "direct" | "hybrid";

export type VeoWorkflow = "url-to-script" | "script-to-scenes";

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
  };
}

export interface VeoErrorEvent {
  event: "error";
  data: {
    type: VeoErrorType;
    message: string;
    retryable: boolean;
  };
}

export type VeoSSEEvent =
  | VeoProgressEvent
  | VeoCharacterEvent
  | VeoCompleteEvent
  | VeoErrorEvent
  | VeoScriptEvent;

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
}

// ============================================================================
// Cached VEO Job
// ============================================================================

export interface CachedVeoJob {
  jobId: string;
  videoId: string;
  videoUrl: string;
  summary: VeoJobSummary;
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  timestamp: number;
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
