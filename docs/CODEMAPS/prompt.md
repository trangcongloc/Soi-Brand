# VEO Pipeline - Codemap

## Overview
Video-to-Scenes generation system using Gemini AI with SSE streaming, resumable jobs, and dual-tier caching.

---

## Directory Structure

```
lib/veo/                    # Core library (23 files)
├── types.ts                # Type definitions
├── index.ts                # Barrel exports
├── constants.ts            # Configuration
├── utils.ts                # Utilities
├── browser-utils.ts        # Environment detection
├── storage-utils.ts        # Storage abstraction
├── auth.ts                 # D1 key validation
├── d1-client.ts            # Cloudflare D1 client
├── cache.ts                # Cache facade
├── cache-local.ts          # localStorage cache
├── cache-remote.ts         # D1 + localStorage hybrid
├── progress.ts             # Progress tracking
├── phase-cache.ts          # Phase-level cache
├── gemini.ts               # Gemini API client
├── prompts.ts              # Prompt templates
├── validation.ts           # Quality scoring
├── settings.ts             # Form settings
├── templates.ts            # Prompt templates
├── scene-processor.ts      # Batch processing
├── colorVocabulary.ts      # Color semantics
└── colorMapper.ts          # Color extraction

app/api/veo/                # API routes (6 endpoints)
├── route.ts                # POST /api/veo (main)
├── jobs/route.ts           # GET/DELETE /api/veo/jobs
├── jobs/[jobId]/route.ts   # GET/PUT/DELETE /api/veo/jobs/:id
├── progress/route.ts       # GET /api/veo/progress
├── verify-key/route.ts     # POST /api/veo/verify-key
└── generate-image/route.ts # POST /api/veo/generate-image

components/veo/             # React components (16 files)
├── index.ts                # Component exports
├── VeoForm.tsx             # Main form
├── VeoUrlInput.tsx         # URL input
├── VeoScriptInput.tsx      # Script input
├── VeoWorkflowSelector.tsx # Workflow selector
├── VeoSettingsPanel.tsx    # Settings panel
├── VeoLoadingState.tsx     # Loading/progress
├── VeoSceneDisplay.tsx     # Results display
├── VeoSceneCard.tsx        # Scene card
├── VeoSceneCards.tsx       # Scene grid
├── VeoCharacterPanel.tsx   # Characters
├── VeoColorProfilePanel.tsx# Color profile
├── VeoHistoryPanel.tsx     # Job history
├── VeoLogPanel.tsx         # API logs
├── VeoDownloadPanel.tsx    # Export
├── VeoJsonView.tsx         # JSON viewer
└── json-highlight.tsx      # Syntax highlight

app/veo/
└── page.tsx                # Main page
```

---

## Key Files

### lib/veo/types.ts
**Purpose**: TypeScript definitions for entire pipeline
**Key Types**:
- `Scene` - Generated scene data
- `CharacterRegistry` - Character name → skeleton mapping
- `CachedVeoJob` - Cached job with metadata
- `VeoProgress` - Progress tracking state
- `CinematicProfile` - Color profile from Phase 0
- `GeminiLogEntry` - API call logs

### lib/veo/gemini.ts
**Purpose**: Gemini API client with retry logic
**Key Functions**:
- `callGeminiAPIWithRetry()` - API call with exponential backoff
- `extractColorProfileFromVideo()` - Phase 0
- `extractCharactersFromVideo()` - Phase 1
- `parseGeminiResponse()` - Response parsing
- `mapErrorToType()` - Error classification

### lib/veo/prompts.ts
**Purpose**: Prompt templates for all phases
**Key Functions**:
- `buildColorProfileExtractionPrompt()` - Phase 0
- `buildCharacterExtractionPrompt()` - Phase 1
- `buildScenePrompt()` - Phase 2
- `buildScriptPrompt()` - Script generation
- `buildContinuityContext()` - Scene continuity (raw)
- `buildContinuityContextCached()` - Scene continuity (PERF-001: jobId-keyed cache)
- `resetContinuityCache()` - Clear continuity cache

### lib/veo/cache-remote.ts
**Purpose**: Hybrid D1 + localStorage caching
**Key Functions**:
- `getCachedJobList()` - Merged job list
- `getCachedJob()` - Get single job (D1 first, localStorage fallback)
- `setCachedJob()` - Save to both
- `syncJobToCloud()` - Push local to D1
- `fixOrphanedJobs()` - Recovery utility

### lib/veo/progress.ts
**Purpose**: Progress tracking with resume support
**Key Functions**:
- `serverProgress` - Server-side Map (30-min TTL)
- `createProgress()` - Initialize progress
- `updateProgressAfterBatch()` - Immutable update
- `getResumeData()` - Extract resume info
- `canResumeProgress()` - Check resumability

### app/api/veo/route.ts
**Purpose**: Main SSE generation endpoint
**Flow**:
1. Validate inputs
2. Rate limit check
3. Phase 0: Color profile (optional)
4. Phase 1: Character extraction (optional)
5. Phase 2: Scene generation (batched)
6. Send complete event

**SSE Events**: script, colorProfile, character, progress, batchComplete, log, logUpdate, complete, error

### app/veo/page.tsx
**Purpose**: Main application page
**State**: ~50 useState hooks
**Features**:
- Form handling
- SSE event processing
- Progress display
- Results visualization
- History sidebar
- Resume system

---

## Data Flow

### Request Flow
```
VeoForm.onSubmit
    ↓
POST /api/veo (body: VeoGenerateRequest)
    ↓
Validation + Rate Limiting
    ↓
[Phase 0] extractColorProfileFromVideo (optional)
    ↓
[Phase 1] extractCharactersFromVideo (optional)
    ↓
[Phase 2] For each batch:
    ├── callGeminiAPIWithRetry
    ├── parseGeminiResponse
    ├── extractCharacterRegistry
    ├── sendBatchCompleteEvent
    └── updateServerProgress
    ↓
Complete Event → Client
    ↓
setCachedJob (localStorage + D1)
```

### Cache Flow
```
getCachedJob(jobId)
    ↓
if databaseKey exists:
    ├── Try D1 API
    │   ├── 200: Return decompressed job
    │   ├── 401: Fall back to localStorage
    │   └── 500: Fall back to localStorage
    └── D1 failed: Return localStorage
else:
    └── Return localStorage
```

### Resume Flow
```
Page Mount
    ↓
fixOrphanedJobs() - Fix stuck "in_progress" jobs
    ↓
Check for incomplete job in localStorage
    ↓
if found && canResumeProgress:
    ├── Show resume prompt
    └── On accept: POST /api/veo with resumeJobId, resumeFromBatch
else:
    └── Show normal form
```

---

## Component Hierarchy

```
VeoPage
├── VeoForm
│   ├── VeoWorkflowSelector
│   ├── VeoUrlInput
│   ├── VeoScriptInput
│   └── VeoSettingsPanel
├── VeoLoadingState
├── VeoSceneDisplay
│   ├── VeoSceneCards
│   │   └── VeoSceneCard
│   │       └── VeoJsonView
│   ├── VeoCharacterPanel
│   ├── VeoColorProfilePanel
│   └── VeoDownloadPanel
├── VeoHistoryPanel
└── VeoLogPanel
```

---

## State Locations

| State | Location | TTL |
|-------|----------|-----|
| Job data | localStorage | 7 days |
| Job data | D1 | 7 days |
| Failed jobs | localStorage | 48 hours |
| In-progress | serverProgress | 30 min |
| Form settings | localStorage | Permanent |
| Phase cache | localStorage | Session |

---

## API Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| /api/veo | POST | - | Generate scenes (SSE) |
| /api/veo/jobs | GET | x-database-key | List all jobs |
| /api/veo/jobs | DELETE | x-database-key | Clear all jobs |
| /api/veo/jobs/:id | GET | x-database-key | Get job |
| /api/veo/jobs/:id | PUT | x-database-key | Update job |
| /api/veo/jobs/:id | DELETE | x-database-key | Delete job |
| /api/veo/progress | GET | - | Check progress |
| /api/veo/verify-key | POST | - | Validate API key |
| /api/veo/generate-image | POST | - | Generate character image |

---

## Error Types

| Type | Retryable | Description |
|------|-----------|-------------|
| QUOTA_EXCEEDED | No | API quota depleted |
| RATE_LIMITED | Yes | Too many requests |
| TIMEOUT | Yes | Request timeout |
| INVALID_RESPONSE | No | Malformed response |
| NETWORK_ERROR | Yes | Connection failed |
| AUTH_ERROR | No | Invalid API key |
| VALIDATION_ERROR | No | Bad input |

---

## Key Constants

```typescript
// Timing
DEFAULT_SECONDS_PER_SCENE = 8
DEFAULT_API_TIMEOUT_MS = 5 * 60 * 1000  // 5 min
SSE_KEEPALIVE_INTERVAL_MS = 15000
BATCH_DELAY_MS = 2000

// Caching
MAX_CACHED_JOBS = 20
CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000  // 7 days
FAILED_JOB_CACHE_TTL_MS = 48 * 60 * 60 * 1000  // 48 hours

// Retry (API-005 FIX)
DEFAULT_MAX_RETRIES = 3
DEFAULT_MAX_RETRY_DELAY_MS = 30000  // 30s max with jitter

// Dynamic Stream Timeout (SSE-003 FIX)
BASE_STREAM_TIMEOUT_MS = 10 * 60 * 1000  // 10 min base
STREAM_TIMEOUT_PER_SCENE_MS = 30 * 1000  // +30s per scene
MAX_STREAM_TIMEOUT_MS = 60 * 60 * 1000   // 60 min max

// SSE Flush (SSE-002 FIX)
SSE_FLUSH_DELAY_MS = 250
SSE_FLUSH_RETRIES = 3
```

---

## Dependencies

### External
- Google Gemini API
- Cloudflare D1 (optional)
- YouTube Data API (metadata)

### Internal
- @/lib/cache-manager (LocalStorageCache)
- @/lib/userSettings (getUserSettings)
- @/lib/lang (translations)
- @/lib/logger (logging)

---

*Last updated: 2026-02-05*
