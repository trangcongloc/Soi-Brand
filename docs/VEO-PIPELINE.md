# VEO Pipeline - Comprehensive Documentation

## Overview

The VEO pipeline is a sophisticated video-to-scenes generation system that uses Google's Gemini AI to analyze YouTube videos and generate detailed scene descriptions in JSON format. The system supports resumable jobs, batched processing, dual-tier caching (localStorage + Cloudflare D1), and multi-language support.

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Framer Motion
- **Backend**: Next.js API Routes with SSE streaming
- **AI**: Google Gemini API (gemini-2.0-flash-exp default)
- **Storage**: localStorage (client) + Cloudflare D1 (cloud sync)
- **Compression**: gzip for D1 storage

### High-Level Data Flow

```
User Input (VeoForm)
       ↓
POST /api/veo (SSE stream)
       ↓
┌──────────────────────────────────────┐
│  Phase 0: Color Profile (optional)   │
│  Extract cinematic color palette     │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  Phase 1: Character Extraction       │
│  Extract character skeletons         │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  Phase 2: Scene Generation (batched) │
│  For each batch:                     │
│    → Call Gemini API                 │
│    → Parse scenes                    │
│    → Extract new characters          │
│    → Send SSE events                 │
│    → Update progress                 │
└──────────────────────────────────────┘
       ↓
Complete: All scenes + metadata
       ↓
Cache to localStorage + D1 (if configured)
```

---

## Workflows

### 1. URL-to-Scenes (Direct Mode)
Video URL → Gemini analyzes video → Scene JSON output

### 2. URL-to-Script → Script-to-Scenes (Hybrid Mode)
Video URL → Gemini generates script → Script parsed → Scenes from script

### 3. Script-to-Scenes
User provides script text → Scenes generated from script

---

## File Structure

```
lib/veo/
├── index.ts              # Barrel exports
├── types.ts              # TypeScript definitions (43.5 KB)
├── constants.ts          # Configuration constants
├── utils.ts              # General utilities
├── browser-utils.ts      # Environment detection
├── storage-utils.ts      # Storage abstraction
├── auth.ts               # D1 key validation
├── d1-client.ts          # Cloudflare D1 REST client
├── cache.ts              # Cache facade
├── cache-local.ts        # localStorage caching
├── cache-remote.ts       # D1 + localStorage hybrid
├── progress.ts           # Progress tracking
├── phase-cache.ts        # Phase-level caching
├── gemini.ts             # Gemini API client
├── prompts.ts            # Prompt templates (92.4 KB)
├── validation.ts         # Quality scoring
├── settings.ts           # Form settings persistence
├── templates.ts          # Pre-built prompt templates
├── scene-processor.ts    # Batch processing logic
├── colorVocabulary.ts    # Semantic color mapping
└── colorMapper.ts        # Color extraction utilities

app/api/veo/
├── route.ts              # Main generation endpoint (71.1 KB)
├── jobs/
│   ├── route.ts          # List/clear all jobs
│   └── [jobId]/route.ts  # Get/update/delete job
├── progress/route.ts     # Check job progress
├── verify-key/route.ts   # Validate Gemini API key
└── generate-image/route.ts # Character image generation

components/veo/
├── index.ts              # Component exports
├── VeoForm.tsx           # Main input form
├── VeoUrlInput.tsx       # YouTube URL input
├── VeoScriptInput.tsx    # Script text input
├── VeoWorkflowSelector.tsx # Workflow radio group
├── VeoSettingsPanel.tsx  # Advanced settings
├── VeoLoadingState.tsx   # Progress display
├── VeoSceneDisplay.tsx   # Results container
├── VeoSceneCard.tsx      # Individual scene card
├── VeoSceneCards.tsx     # Scene grid/list
├── VeoCharacterPanel.tsx # Character display
├── VeoColorProfilePanel.tsx # Color profile visualization
├── VeoHistoryPanel.tsx   # Job history sidebar
├── VeoLogPanel.tsx       # Gemini API logs
├── VeoDownloadPanel.tsx  # Export functionality
├── VeoJsonView.tsx       # JSON syntax highlighting
└── json-highlight.tsx    # Syntax highlighting utility

app/veo/
└── page.tsx              # Main VEO application page
```

---

## Core Types

### Scene
```typescript
interface Scene {
  sceneNumber: number;
  timeRange: string;
  description: string;
  style: StyleObject;
  visualSpecs: VisualSpecs;
  lighting: Lighting;
  composition: Composition;
  technical: Technical;
  characters?: string[];
  dialogue?: DialogueSpec;
  audioSpec?: AudioSpec;
  negativePrompt?: string;
}
```

### CachedVeoJob
```typescript
interface CachedVeoJob {
  jobId: string;
  videoId: string;
  videoUrl: string;
  summary: VeoJobSummary;
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  timestamp: number;
  expiresAt: number;
  script?: GeneratedScript;
  colorProfile?: CinematicProfile;
  logs?: GeminiLogEntry[];
  status: VeoJobStatus; // "completed" | "in_progress" | "failed" | "partial"
  error?: VeoJobError;
  resumeData?: ResumeData;
}
```

### VeoProgress
```typescript
interface VeoProgress {
  jobId: string;
  videoId: string;
  mode: VeoMode;
  status: VeoJobStatus;
  totalBatches: number;
  completedBatches: number;
  sceneCount: number;
  charactersFound: number;
  lastError?: string;
  lastUpdated: number;
}
```

---

## API Endpoints

### POST /api/veo
Main scene generation endpoint with SSE streaming.

**Request Body:**
```typescript
{
  workflow: "url-to-script" | "script-to-scenes" | "url-to-scenes";
  videoUrl?: string;
  scriptText?: string;
  mode: "direct" | "hybrid";
  sceneCountMode: "auto" | "manual" | "gemini";
  sceneCount: number;
  batchSize: number;
  voice: VoiceLanguage;
  geminiApiKey?: string;
  geminiModel?: string;
  resumeJobId?: string;
  resumeFromBatch?: number;
  existingScenes?: Scene[];
  existingCharacters?: CharacterRegistry;
  extractColorProfile?: boolean;
  // ... more options
}
```

**SSE Events:**
| Event | Description |
|-------|-------------|
| `script` | Script generated (Step 1) |
| `colorProfile` | Phase 0 color profile extracted |
| `character` | New character discovered |
| `progress` | Batch progress update |
| `batchComplete` | Batch finished with scenes |
| `log` | Gemini API call logged |
| `logUpdate` | Log entry status updated |
| `complete` | Job finished successfully |
| `error` | Error occurred (with retry info) |

### GET /api/veo/jobs
List all cached jobs from D1.

### GET /api/veo/jobs/[jobId]
Get full job data (decompressed from D1).

### PUT /api/veo/jobs/[jobId]
Save/update job in D1 (compressed with gzip).

### DELETE /api/veo/jobs/[jobId]
Delete specific job.

### GET /api/veo/progress?jobId=xxx
Check in-progress job status from server memory.

### POST /api/veo/verify-key
Validate Gemini API key and list available models.

---

## Caching Architecture

### Two-Tier System

```
┌─────────────────────────────────────────┐
│            Application Layer            │
│         cache.ts (facade)               │
└─────────────────┬───────────────────────┘
                  │
     ┌────────────┴────────────┐
     │                         │
┌────▼─────────────┐  ┌───────▼──────────┐
│  cache-local.ts  │  │  cache-remote.ts │
│  (localStorage)  │  │  (D1 + fallback) │
│  - 7 day TTL     │  │  - Cloud sync    │
│  - Max 20 jobs   │  │  - gzip compress │
│  - Instant       │  │  - Cross-device  │
└──────────────────┘  └────────┬─────────┘
                               │
                      ┌────────▼─────────┐
                      │   d1-client.ts   │
                      │   (REST API)     │
                      └────────┬─────────┘
                               │
                      ┌────────▼─────────┐
                      │  Cloudflare D1   │
                      └──────────────────┘
```

### Cache TTLs
- **Completed jobs**: 7 days
- **Failed/Partial jobs**: 48 hours
- **In-progress jobs**: 30 minutes (server memory)

### Merge Strategy
When listing jobs:
1. Fetch from D1 (cloud)
2. Fetch from localStorage (local)
3. Merge: cloud jobs take precedence
4. Sort by timestamp (newest first)

---

## Progress Tracking

### Client-Side (localStorage)
- Persists across page refreshes
- Used for resume functionality
- Stores full VeoProgress object

### Server-Side (in-memory Map)
- 30-minute TTL with auto-cleanup
- Max 100 entries
- Used for real-time progress queries
- Lost on server restart

### Resume Flow
```
1. User starts job → progress saved to localStorage
2. Job interrupted (network, browser close, etc.)
3. User returns → check localStorage for incomplete job
4. If found and < 30 min old → offer resume
5. Resume sends: resumeJobId, resumeFromBatch, existingScenes, existingCharacters
6. Server continues from last completed batch
```

---

## Phase System

### Phase 0: Color Profile Extraction (Optional)
- Extracts cinematic color palette from video
- Returns: dominant colors, mood, film stock, grain, contrast
- Cached separately for reuse

### Phase 1: Character Extraction (Optional)
- Extracts character skeletons from video
- Returns: names, physical attributes, clothing, expressions
- Cached for continuity across scenes

### Phase 2: Scene Generation (Batched)
- Processes scenes in configurable batch sizes (1-60)
- Each batch:
  - Calls Gemini API with prompt + continuity context
  - Parses JSON response
  - Extracts new characters from scene descriptions
  - Sends progress events
  - Updates server progress

---

## Quality Scoring System

### 10-Point Checklist
1. Character description completeness
2. Scene environment details
3. Camera position/movement
4. Lighting setup
5. Audio specifications
6. Dialogue formatting (VEO 3 colon format)
7. Negative prompt presence
8. Technical specifications
9. Continuity references
10. Time range accuracy

### Scoring Components (0-10 each)
- Character description
- Scene details
- Camera specs
- Lighting
- Audio
- Dialogue
- Negatives

### Overall Score (0-100%)
Weighted average with success rate prediction.

---

## VEO 3 Techniques

### Dialogue Formatting
```
Character Name: "Dialogue here"
```
Prevents subtitle generation in video output.

### Physics Awareness
Prompts include natural physics behavior instructions.

### Expression Control
Detailed facial expression specifications.

### Audio Hallucination Prevention
Explicit audio layer specifications to prevent unwanted sounds.

### Advanced Camera
- Multiple POV options
- Lens effects (bokeh, flare)
- Professional movements (dolly, crane, steadicam)

---

## Component Hierarchy

```
VeoPage (orchestrator)
├── VeoForm (input)
│   ├── VeoWorkflowSelector
│   ├── VeoUrlInput
│   ├── VeoScriptInput
│   └── VeoSettingsPanel
│
├── VeoLoadingState (progress)
│
├── VeoSceneDisplay (results)
│   ├── VeoSceneCards (grid)
│   │   └── VeoSceneCard (individual)
│   ├── VeoCharacterPanel
│   ├── VeoColorProfilePanel
│   └── VeoDownloadPanel
│
├── VeoHistoryPanel (cached jobs)
│
└── VeoLogPanel (debug logs)
```

---

## State Management

### Page-Level State (app/veo/page.tsx)
- ~50 useState hooks for form fields, progress, results
- useEffect for SSE handling, settings loading, auto-save
- useCallback for event handlers
- useMemo for computed values

### Key State Variables
```typescript
// Workflow
workflow: VeoWorkflow
mode: VeoMode
state: "idle" | "loading" | "script-complete" | "complete" | "error"

// Input
videoUrl: string
scriptText: string
startTime: string
endTime: string

// Progress
batch: number
totalBatches: number
scenesGenerated: number
charactersFound: number

// Results
generatedScript: GeneratedScript | null
scenes: Scene[]
characterRegistry: CharacterRegistry
colorProfile: CinematicProfile | null
geminiLogs: GeminiLogEntry[]
summary: VeoJobSummary | null
```

---

## Error Handling

### Error Types
```typescript
type VeoErrorType =
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR"
  | "AUTH_ERROR"
  | "VALIDATION_ERROR"
  | "UNKNOWN";
```

### Retry Logic
- Exponential backoff with jitter
- Max 3 retries by default
- Retryable errors: RATE_LIMITED, TIMEOUT, NETWORK_ERROR
- Non-retryable: QUOTA_EXCEEDED, AUTH_ERROR, VALIDATION_ERROR

### Graceful Degradation
- D1 unavailable → fall back to localStorage
- Phase 0/1 fails → continue with Phase 2
- Batch fails → save partial progress, allow resume

---

## Configuration

### Environment Variables
```env
GEMINI_API_KEY=xxx              # Google Gemini API key
CLOUDFLARE_ACCOUNT_ID=xxx       # D1 account
CLOUDFLARE_D1_DATABASE_ID=xxx   # D1 database
CLOUDFLARE_D1_API_TOKEN=xxx     # D1 auth token
DATABASE_ACCESS_KEYS=key1,key2  # Valid access keys (comma-separated)
```

### Constants (lib/veo/constants.ts)
```typescript
// Timing
DEFAULT_SECONDS_PER_SCENE = 8
CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000  // 7 days
FAILED_JOB_CACHE_TTL_MS = 48 * 60 * 60 * 1000  // 48 hours

// Limits
MAX_CACHED_JOBS = 20
DEFAULT_MAX_RETRIES = 3
DEFAULT_API_TIMEOUT_MS = 5 * 60 * 1000  // 5 minutes

// SSE
SSE_KEEPALIVE_INTERVAL_MS = 15000
BATCH_DELAY_MS = 2000

// Quality
MIN_CHAR_ATTRS_FULL_SCORE = 15
MIN_SCENE_DETAILS_FULL_SCORE = 10
```

---

## Security

### API Key Validation
- x-database-key header required for D1 access
- Keys validated against DATABASE_ACCESS_KEYS env var
- 401 returned for invalid keys

### Input Validation
- YouTube URL format validation
- Scene count bounds (1-200)
- Batch size bounds (1-60)
- Script length validation

### Rate Limiting
- Gemini API tier-based limits respected
- Batch delays between API calls
- Retry with exponential backoff

---

## Performance Optimizations

### Batched Processing
- Configurable batch size (1-60 scenes)
- Reduces API calls
- Allows incremental progress

### Compression
- D1 data compressed with gzip
- Reduces storage and transfer costs

### Caching
- localStorage for instant local access
- D1 for cross-device persistence
- Phase-level caching for resume

### SSE Streaming
- Real-time progress updates
- No polling required
- Keeps connection alive with keepalives

---

## Debugging

### Gemini Log Panel
- Shows all API calls with timing
- Request/response bodies (expandable)
- Token usage
- Error details

### Console Logging
- Prefixed with `[VEO]`, `[Cache]`, `[Progress]`
- Verbosity controlled by NODE_ENV

### Server Progress Endpoint
- GET /api/veo/progress?jobId=xxx
- Returns current server-side progress
- Useful for debugging stuck jobs

---

## File Summary

| Category | Files | Total Size |
|----------|-------|------------|
| Core Types | 1 | 43.5 KB |
| Utilities | 8 | ~50 KB |
| AI/Prompts | 2 | 113 KB |
| Caching | 4 | ~22 KB |
| Progress | 2 | ~13 KB |
| API Routes | 6 | ~75 KB |
| Components | 16 | ~150 KB |
| Page | 1 | ~15 KB |
| **TOTAL** | **40** | **~480 KB** |

---

## Quick Reference

### Start a Job
```typescript
const response = await fetch('/api/veo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflow: 'url-to-scenes',
    videoUrl: 'https://youtube.com/watch?v=xxx',
    mode: 'direct',
    sceneCountMode: 'auto',
    sceneCount: 10,
    batchSize: 5,
    voice: 'no-voice',
  }),
});

const reader = response.body.getReader();
// Handle SSE events...
```

### Resume a Job
```typescript
const response = await fetch('/api/veo', {
  method: 'POST',
  body: JSON.stringify({
    workflow: 'url-to-scenes',
    videoUrl: '...',
    resumeJobId: 'veo_1234567890_abc',
    resumeFromBatch: 3,
    existingScenes: [...],
    existingCharacters: {...},
  }),
});
```

### Check Progress
```typescript
const response = await fetch(`/api/veo/progress?jobId=${jobId}`);
const { data } = await response.json();
console.log(data.progressPercent, data.message);
```

### Get Cached Job
```typescript
import { getCachedJob } from '@/lib/veo';
const job = await getCachedJob(jobId);
```

---

*Last updated: 2026-02-04*
