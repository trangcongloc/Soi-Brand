/**
 * VEO Test Fixtures - Factory Functions
 * Dynamic generation of test data for VEO pipeline testing
 */

import type {
  CachedPromptJob,
  Scene,
  CharacterRegistry,
  CharacterSkeleton,
  PromptJobSummary,
  PromptJobStatus,
  PromptMode,
  PromptWorkflow,
  VoiceLanguage,
  PromptErrorType,
  PromptProgress,
  PromptResumeData,
  StyleObject,
  VisualSpecs,
  Lighting,
  Composition,
  Technical,
  CinematicProfile,
  EnrichedColorEntry,
  GeminiLogEntry,
  MediaType,
  SceneCountMode,
} from "@/lib/prompt/types";

import { CACHE_TTL_MS } from "@/lib/prompt/constants";

// ============================================================================
// Test URL Constants
// ============================================================================

/** Dummy URL for testing - triggers validation errors */
export const DUMMY_URL = "__DUMMY__";

/** Valid YouTube URL formats for testing */
export const TEST_URLS = {
  standard: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  short: "https://youtu.be/dQw4w9WgXcQ",
  embed: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  mobile: "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
  withTimestamp: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120",
  withPlaylist: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
  dummy: DUMMY_URL,
  invalid: "not-a-url",
  wrongDomain: "https://vimeo.com/123456789",
  empty: "",
};

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_STYLE: StyleObject = {
  genre: "cinematic",
  art_movement: "contemporary realism",
  medium: "digital film",
  palette: "natural warm tones",
  color_temperature: "5600K daylight",
  contrast: "medium",
  texture: "smooth",
  brushwork_or_line: "clean",
  rendering_engine: "native",
  camera_lens: "35mm",
  focal_length: "35mm",
  depth_of_field: "medium",
  film_stock_or_profile: "Kodak Portra 400",
  grain: "subtle",
  noise_reduction: "moderate",
  post_processing: "natural color grade",
  composition_style: "rule of thirds",
  mood: "engaging",
  lighting_style: "natural",
};

const DEFAULT_VISUAL_SPECS: VisualSpecs = {
  primary_subject: "Chef preparing ingredients",
  environment: "Professional kitchen",
  key_details: "Stainless steel counters, hanging pots",
};

const DEFAULT_LIGHTING: Lighting = {
  mood: "warm and inviting",
  source: "overhead practical lights",
  shadows: "soft with natural falloff",
};

const DEFAULT_COMPOSITION: Composition = {
  angle: "eye level",
  framing: "medium shot",
  focus: "subject centered",
};

const DEFAULT_TECHNICAL: Technical = {
  quality: "4K broadcast",
  colors: "rec709",
};

// ============================================================================
// ID Generators
// ============================================================================

let jobIdCounter = 0;
let sceneIdCounter = 0;
let logIdCounter = 0;

export function generateTestJobId(): string {
  jobIdCounter += 1;
  return `test-job-${jobIdCounter}-${Date.now()}`;
}

export function generateTestSceneId(): string {
  sceneIdCounter += 1;
  return `scene-${sceneIdCounter}`;
}

export function generateTestLogId(): string {
  logIdCounter += 1;
  return `log-${logIdCounter}`;
}

export function resetTestCounters(): void {
  jobIdCounter = 0;
  sceneIdCounter = 0;
  logIdCounter = 0;
}

// ============================================================================
// Scene Factory
// ============================================================================

export interface CreateMockSceneOptions {
  id?: string;
  sequence?: number;
  description?: string;
  object?: string;
  character?: string;
  style?: Partial<StyleObject>;
  visual_specs?: Partial<VisualSpecs>;
  lighting?: Partial<Lighting>;
  composition?: Partial<Composition>;
  technical?: Partial<Technical>;
  prompt?: string;
  negativePrompt?: string;
  voice?: string;
  mediaType?: MediaType;
  characterVariations?: Record<string, {
    outfit?: string;
    accessories?: string;
    expression?: string;
    pose?: string;
    injuries?: string;
  }>;
}

export function createMockScene(options: CreateMockSceneOptions = {}): Scene {
  const id = options.id ?? generateTestSceneId();
  const sequence = options.sequence ?? 1;

  return {
    id,
    sequence,
    mediaType: options.mediaType ?? "video",
    description: options.description ?? `Scene ${sequence}: Chef demonstrates technique`,
    object: options.object ?? "cooking utensils",
    character: options.character ?? "Chef Marco",
    style: { ...DEFAULT_STYLE, ...options.style },
    visual_specs: { ...DEFAULT_VISUAL_SPECS, ...options.visual_specs },
    lighting: { ...DEFAULT_LIGHTING, ...options.lighting },
    composition: { ...DEFAULT_COMPOSITION, ...options.composition },
    technical: { ...DEFAULT_TECHNICAL, ...options.technical },
    prompt: options.prompt ?? `Cinematic shot of Chef Marco in professional kitchen, ${DEFAULT_STYLE.film_stock_or_profile} film look`,
    negativePrompt: options.negativePrompt,
    voice: options.voice,
    characterVariations: options.characterVariations,
  };
}

export function createMockScenes(count: number, baseOptions: CreateMockSceneOptions = {}): Scene[] {
  return Array.from({ length: count }, (_, i) =>
    createMockScene({
      ...baseOptions,
      sequence: i + 1,
      description: `Scene ${i + 1}: ${baseOptions.description ?? "Action in progress"}`,
    })
  );
}

// ============================================================================
// Character Factory
// ============================================================================

export interface CreateMockCharacterOptions {
  name?: string;
  gender?: string;
  age?: string;
  ethnicity?: string;
  bodyType?: string;
  faceShape?: string;
  hair?: string;
  facialHair?: string;
  distinctiveFeatures?: string;
  baseOutfit?: string;
  firstAppearance?: string;
}

export function createMockCharacter(options: CreateMockCharacterOptions = {}): CharacterSkeleton {
  return {
    name: options.name ?? "Chef Marco",
    gender: options.gender ?? "male",
    age: options.age ?? "40s",
    ethnicity: options.ethnicity ?? "Italian, olive skin",
    bodyType: options.bodyType ?? "tall, stocky build",
    faceShape: options.faceShape ?? "square jaw, prominent nose",
    hair: options.hair ?? "salt-and-pepper, short, slicked back",
    facialHair: options.facialHair ?? "trimmed goatee",
    distinctiveFeatures: options.distinctiveFeatures ?? "scar on left cheek",
    baseOutfit: options.baseOutfit ?? "white chef coat, black apron",
    firstAppearance: options.firstAppearance ?? "0:05",
  };
}

export function createMockCharacterRegistry(
  characters: Array<string | CharacterSkeleton>
): CharacterRegistry {
  const registry: CharacterRegistry = {};

  for (const char of characters) {
    if (typeof char === "string") {
      registry[char] = `A character named ${char}`;
    } else {
      registry[char.name] = char;
    }
  }

  return registry;
}

// ============================================================================
// Cinematic Profile Factory
// ============================================================================

export interface CreateMockCinematicProfileOptions {
  dominantColors?: EnrichedColorEntry[];
  colorTemperature?: Partial<CinematicProfile["colorTemperature"]>;
  contrast?: Partial<CinematicProfile["contrast"]>;
  shadows?: Partial<CinematicProfile["shadows"]>;
  highlights?: Partial<CinematicProfile["highlights"]>;
  filmStock?: Partial<CinematicProfile["filmStock"]>;
  mood?: Partial<CinematicProfile["mood"]>;
  grain?: Partial<CinematicProfile["grain"]>;
  postProcessing?: Partial<CinematicProfile["postProcessing"]>;
}

const DEFAULT_ENRICHED_COLORS: EnrichedColorEntry[] = [
  {
    hex: "#2C3E50",
    name: "dark slate blue",
    usage: "background",
    semanticName: "deep ocean mystery blue",
    moods: ["professional", "calm", "trustworthy"],
    temperature: "cool",
    psychologyNotes: "Evokes stability and trust",
    confidence: 0.95,
  },
  {
    hex: "#E74C3C",
    name: "warm coral red",
    usage: "accent",
    semanticName: "energetic passion red",
    moods: ["energetic", "passionate", "urgent"],
    temperature: "warm",
    psychologyNotes: "Draws attention, conveys importance",
    confidence: 0.88,
  },
  {
    hex: "#F5DEB3",
    name: "wheat",
    usage: "skin tones",
    semanticName: "natural warmth beige",
    moods: ["natural", "warm", "organic"],
    temperature: "warm",
    psychologyNotes: "Creates approachable, human connection",
    confidence: 0.92,
  },
];

export function createMockCinematicProfile(
  options: CreateMockCinematicProfileOptions = {}
): CinematicProfile {
  return {
    dominantColors: options.dominantColors ?? DEFAULT_ENRICHED_COLORS,
    colorTemperature: {
      category: "warm",
      kelvinEstimate: 5600,
      description: "Natural daylight with warm undertones",
      ...options.colorTemperature,
    },
    contrast: {
      level: "medium",
      style: "soft and natural",
      blackPoint: "lifted slightly for vintage feel",
      whitePoint: "preserved highlights",
      ...options.contrast,
    },
    shadows: {
      color: "cool blue-grey",
      density: "medium",
      falloff: "gradual and soft",
      ...options.shadows,
    },
    highlights: {
      color: "warm cream",
      handling: "soft roll-off",
      bloom: false,
      ...options.highlights,
    },
    filmStock: {
      suggested: "Kodak Portra 400",
      characteristics: "natural skin tones, fine grain",
      digitalProfile: "CineStyle/LOG",
      ...options.filmStock,
    },
    mood: {
      primary: "warm and inviting",
      atmosphere: "comfortable, professional",
      emotionalTone: "confident yet approachable",
      ...options.mood,
    },
    grain: {
      amount: "subtle",
      type: "fine photographic grain",
      pattern: "organic and natural",
      ...options.grain,
    },
    postProcessing: {
      colorGrade: "warm teal and orange",
      saturation: "slightly desaturated for cinema look",
      vignettePresent: false,
      splitToning: {
        shadows: "cool blue",
        highlights: "warm orange",
      },
      ...options.postProcessing,
    },
  };
}

// ============================================================================
// Job Summary Factory
// ============================================================================

export interface CreateMockJobSummaryOptions {
  mode?: PromptMode;
  youtubeUrl?: string;
  videoId?: string;
  targetScenes?: number;
  actualScenes?: number;
  batches?: number;
  batchSize?: number;
  voice?: string;
  charactersFound?: number;
  characters?: string[];
  processingTime?: string;
  createdAt?: string;
  status?: PromptJobStatus;
  error?: {
    message: string;
    type: PromptErrorType;
    failedBatch?: number;
    totalBatches?: number;
    retryable: boolean;
  };
}

export function createMockJobSummary(options: CreateMockJobSummaryOptions = {}): PromptJobSummary {
  const targetScenes = options.targetScenes ?? 10;
  const actualScenes = options.actualScenes ?? targetScenes;

  return {
    mode: options.mode ?? "direct",
    youtubeUrl: options.youtubeUrl ?? "https://www.youtube.com/watch?v=test123",
    videoId: options.videoId ?? "test123",
    targetScenes,
    actualScenes,
    batches: options.batches ?? Math.ceil(targetScenes / (options.batchSize ?? 5)),
    batchSize: options.batchSize ?? 5,
    voice: options.voice ?? "english",
    charactersFound: options.charactersFound ?? 2,
    characters: options.characters ?? ["Chef Marco", "Sous Chef Anna"],
    processingTime: options.processingTime ?? "45s",
    createdAt: options.createdAt ?? new Date().toISOString(),
    status: options.status,
    error: options.error,
  };
}

// ============================================================================
// Cached Job Factory
// ============================================================================

export interface CreateMockJobOptions {
  jobId?: string;
  videoId?: string;
  videoUrl?: string;
  status?: PromptJobStatus;
  scenes?: Scene[];
  sceneCount?: number;
  characterRegistry?: CharacterRegistry;
  timestamp?: number;
  expiresAt?: number;
  colorProfile?: CinematicProfile;
  logs?: GeminiLogEntry[];
  error?: {
    message: string;
    type: PromptErrorType;
    failedBatch?: number;
    totalBatches?: number;
    retryable: boolean;
  };
  resumeData?: {
    completedBatches: number;
    existingScenes: Scene[];
    existingCharacters: CharacterRegistry;
    workflow: PromptWorkflow;
    mode: PromptMode;
    batchSize: number;
    sceneCount: number;
    voice: VoiceLanguage;
    colorProfile?: CinematicProfile;
    useVideoTitle?: boolean;
    useVideoDescription?: boolean;
    useVideoChapters?: boolean;
    useVideoCaptions?: boolean;
    negativePrompt?: string;
    extractColorProfile?: boolean;
    mediaType?: MediaType;
    sceneCountMode?: SceneCountMode;
    startTime?: string;
    endTime?: string;
    selfieMode?: boolean;
  };
  summaryOverrides?: Partial<PromptJobSummary>;
}

export function createMockJob(options: CreateMockJobOptions = {}): CachedPromptJob {
  const jobId = options.jobId ?? generateTestJobId();
  const videoId = options.videoId ?? "test-video-123";
  const status = options.status ?? "completed";
  const timestamp = options.timestamp ?? Date.now();

  // Generate scenes if not provided
  const sceneCount = options.sceneCount ?? 10;
  const scenes = options.scenes ?? createMockScenes(sceneCount);

  // Generate character registry if not provided
  const characterRegistry = options.characterRegistry ?? createMockCharacterRegistry([
    createMockCharacter({ name: "Chef Marco" }),
    createMockCharacter({ name: "Sous Chef Anna", gender: "female", age: "30s" }),
  ]);

  const summary = createMockJobSummary({
    videoId,
    youtubeUrl: options.videoUrl ?? `https://www.youtube.com/watch?v=${videoId}`,
    actualScenes: scenes.length,
    targetScenes: sceneCount,
    status,
    error: options.error,
    ...options.summaryOverrides,
  });

  return {
    jobId,
    videoId,
    videoUrl: options.videoUrl ?? `https://www.youtube.com/watch?v=${videoId}`,
    summary,
    scenes,
    characterRegistry,
    timestamp,
    expiresAt: options.expiresAt ?? timestamp + CACHE_TTL_MS,
    colorProfile: options.colorProfile,
    status,
    error: options.error,
    logs: options.logs,
    resumeData: options.resumeData,
  };
}

// ============================================================================
// Progress Factory
// ============================================================================

export interface CreateMockProgressOptions {
  jobId?: string;
  mode?: PromptMode;
  youtubeUrl?: string;
  videoId?: string;
  sceneCount?: number;
  batchSize?: number;
  voiceLang?: VoiceLanguage;
  totalBatches?: number;
  completedBatches?: number;
  characterRegistry?: CharacterRegistry;
  scenes?: Scene[];
  lastError?: string;
  lastUpdated?: string;
  status?: "pending" | "in_progress" | "completed" | "failed";
  scriptText?: string;
}

export function createMockProgress(options: CreateMockProgressOptions = {}): PromptProgress {
  const sceneCount = options.sceneCount ?? 10;
  const batchSize = options.batchSize ?? 5;
  const totalBatches = options.totalBatches ?? Math.ceil(sceneCount / batchSize);
  const completedBatches = options.completedBatches ?? 0;

  // Calculate scenes based on completed batches
  const completedSceneCount = Math.min(completedBatches * batchSize, sceneCount);
  const scenes = options.scenes ?? createMockScenes(completedSceneCount);

  return {
    jobId: options.jobId ?? generateTestJobId(),
    mode: options.mode ?? "direct",
    youtubeUrl: options.youtubeUrl ?? "https://www.youtube.com/watch?v=test123",
    videoId: options.videoId ?? "test123",
    sceneCount,
    batchSize,
    voiceLang: options.voiceLang ?? "english",
    totalBatches,
    completedBatches,
    characterRegistry: options.characterRegistry ?? createMockCharacterRegistry([
      createMockCharacter(),
    ]),
    scenes,
    lastError: options.lastError,
    lastUpdated: options.lastUpdated ?? new Date().toISOString(),
    status: options.status ?? "in_progress",
    scriptText: options.scriptText,
  };
}

// ============================================================================
// Resume Data Factory
// ============================================================================

export interface CreateMockResumeDataOptions {
  jobId?: string;
  videoUrl?: string;
  scriptText?: string;
  mode?: PromptMode;
  sceneCount?: number;
  batchSize?: number;
  voice?: VoiceLanguage;
  completedBatches?: number;
  totalBatches?: number;
  existingScenes?: Scene[];
  existingCharacters?: CharacterRegistry;
}

export function createMockResumeData(options: CreateMockResumeDataOptions = {}): PromptResumeData {
  const sceneCount = options.sceneCount ?? 10;
  const batchSize = options.batchSize ?? 5;
  const completedBatches = options.completedBatches ?? 2;

  // Calculate completed scenes
  const completedSceneCount = Math.min(completedBatches * batchSize, sceneCount);
  const existingScenes = options.existingScenes ?? createMockScenes(completedSceneCount);

  return {
    jobId: options.jobId ?? generateTestJobId(),
    videoUrl: options.videoUrl ?? "https://www.youtube.com/watch?v=test123",
    scriptText: options.scriptText ?? "Generated script text for testing",
    mode: options.mode ?? "direct",
    sceneCount,
    batchSize,
    voice: options.voice ?? "english",
    completedBatches,
    totalBatches: options.totalBatches ?? Math.ceil(sceneCount / batchSize),
    existingScenes,
    existingCharacters: options.existingCharacters ?? createMockCharacterRegistry([
      createMockCharacter(),
    ]),
  };
}

// ============================================================================
// Gemini Log Entry Factory
// ============================================================================

export interface CreateMockLogEntryOptions {
  id?: string;
  timestamp?: string;
  phase?: "phase-0" | "phase-1" | "phase-2";
  batchNumber?: number;
  status?: "pending" | "completed";
  model?: string;
  videoUrl?: string;
  success?: boolean;
  finishReason?: string;
  parsedItemCount?: number;
  durationMs?: number;
  retries?: number;
  promptTokens?: number;
  candidatesTokens?: number;
  errorType?: string;
  errorMessage?: string;
}

export function createMockLogEntry(options: CreateMockLogEntryOptions = {}): GeminiLogEntry {
  const id = options.id ?? generateTestLogId();
  const success = options.success ?? true;

  return {
    id,
    timestamp: options.timestamp ?? new Date().toISOString(),
    phase: options.phase ?? "phase-2",
    batchNumber: options.batchNumber,
    status: options.status ?? "completed",
    request: {
      model: options.model ?? "gemini-2.0-flash-exp",
      body: JSON.stringify({ contents: [], generationConfig: {} }),
      promptLength: 1500,
      videoUrl: options.videoUrl ?? "https://www.youtube.com/watch?v=test123",
    },
    response: {
      success,
      finishReason: options.finishReason ?? (success ? "STOP" : "ERROR"),
      body: JSON.stringify({ candidates: [] }),
      responseLength: 2000,
      parsedItemCount: options.parsedItemCount ?? 5,
      parsedSummary: `${options.parsedItemCount ?? 5} scenes`,
    },
    timing: {
      durationMs: options.durationMs ?? 3500,
      retries: options.retries ?? 0,
    },
    tokens: options.promptTokens !== undefined ? {
      prompt: options.promptTokens,
      candidates: options.candidatesTokens ?? 500,
      total: (options.promptTokens) + (options.candidatesTokens ?? 500),
    } : undefined,
    error: options.errorType ? {
      type: options.errorType,
      message: options.errorMessage ?? "Unknown error",
    } : undefined,
  };
}

// ============================================================================
// Time Helpers
// ============================================================================

export function hoursAgo(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000;
}

export function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export function minutesAgo(minutes: number): number {
  return Date.now() - minutes * 60 * 1000;
}

export function secondsAgo(seconds: number): number {
  return Date.now() - seconds * 1000;
}
