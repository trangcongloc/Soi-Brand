# Soi'Brand — Codebase Workflow

## Feature 1: YouTube Channel Analysis

```mermaid
flowchart TD
    A[User enters YouTube URL] --> B{URL Valid?}
    B -->|No| B1[Show error]
    B -->|Yes| C{Cache hit?}
    C -->|Yes| C1[Display cached report]
    C -->|No| D[POST /api/analyze]

    D --> E[Zod validation]
    E --> F{Rate limit OK?}
    F -->|No| F1[429 Too Many Requests]
    F -->|Yes| G[getFullChannelData]

    G --> G1[resolveChannelId]
    G1 --> G2[getChannelInfo\nsnippet + statistics]
    G2 --> G3[getChannelVideos\nlast 30 days, max 500]

    G3 --> H[generateMarketingReport]
    H --> H1[Prepare data\nposting patterns, engagement]
    H1 --> H2[buildMarketingReportPrompt]
    H2 --> H3[Gemini API call]
    H3 --> H4[extractAndParseJSON\nrepair malformed JSON]
    H4 --> H5[validateAIResponseSchema\nZod validation]

    H5 --> I[Assemble MarketingReport]
    I --> I1[report_part_1: Channel + Videos]
    I --> I2[report_part_2: Strategy + Funnel]
    I --> I3[report_part_3: Insights + Actions]

    I1 & I2 & I3 --> J[Return to client]
    J --> K[Cache report\nlocalStorage]
    K --> L[Redirect to /report]

    style A fill:#4CAF50,color:#fff
    style D fill:#2196F3,color:#fff
    style H3 fill:#FF9800,color:#fff
    style L fill:#9C27B0,color:#fff
```

### Key Files

| Layer | File | Purpose |
|-------|------|---------|
| UI | `app/page.tsx` | Home page, form submission |
| API | `app/api/analyze/route.ts` | Validation, orchestration |
| YouTube | `lib/youtube.ts` | Channel + video data fetch |
| AI | `lib/gemini.ts` | Marketing report generation |
| Prompt | `lib/prompts/marketing-report.ts` | AI prompt template |
| Cache | `lib/cache.ts` | localStorage TTL cache |

---

## Feature 2: Prompt/VEO Pipeline

### Overview

```mermaid
flowchart TD
    A[User submits form] --> B{Workflow?}
    B -->|url-to-script| W1[Script only]
    B -->|script-to-scenes| W2[Scenes from text]
    B -->|url-to-scenes| W3[Full pipeline]

    W3 --> C[POST /api/prompt\nSSE stream]
    C --> D[Fetch YouTube metadata\ngetVideoInfo]
    D --> E[Calculate scene count\nfrom video duration]
    E --> F{extractColorProfile?}
    F -->|Yes| G[Video Analysis\nPhase 0+1 merged]
    F -->|No| H[Phase 1 only\ncharacter extraction]

    G --> G1[extractVideoAnalysis\nsingle Gemini API call]
    G1 --> G2[CinematicProfile\n5-8 colors, mood, film stock]
    G1 --> G3[CharacterSkeleton array\nname, gender, age, outfit...]
    G1 --> G4[Background description]

    G2 & G3 & G4 --> I[SSE: videoAnalysis event]
    H --> I

    I --> J{Mode?}
    J -->|Direct| K[runUrlToScenesDirect\ntime-based batching]
    J -->|Hybrid| L[runUrlToScript\nthen runScriptToScenesHybrid]

    K & L --> M[runBatchLoop]
    M --> N[Scene Generation\nbatched Phase 2]
    N --> O[SSE: complete event]
    O --> P[Client saves to D1 cache]

    style A fill:#4CAF50,color:#fff
    style C fill:#2196F3,color:#fff
    style G1 fill:#FF9800,color:#fff
    style N fill:#FF9800,color:#fff
    style O fill:#9C27B0,color:#fff
```

### Phase 0+1: Video Analysis (Merged)

```mermaid
flowchart LR
    V[YouTube Video URL] --> A[buildVideoAnalysisPrompt]
    A --> B[VIDEO_ANALYSIS_SYSTEM\ncinematographer + character analyst]
    A --> C[VIDEO_ANALYSIS_SCHEMA\nJSON response schema]

    B & C --> D[Gemini API\nsingle call]

    D --> E[parseVideoAnalysisResponse]
    E --> F[CinematicProfile]
    E --> G[CharacterSkeleton array]
    E --> H[Background string]

    F --> F1[dominantColors: 5-8\nhex + semantic name + moods]
    F --> F2[colorTemperature\ncategory + Kelvin]
    F --> F3[contrast + shadows\nhighlights + grain]
    F --> F4[filmStock + mood\npostProcessing]

    G --> G1[name, gender, age\nethnicity, bodyType]
    G --> G2[faceShape, hair\nfacialHair, features]
    G --> G3[baseOutfit\nfirstAppearance timestamp]

    style V fill:#f44336,color:#fff
    style D fill:#FF9800,color:#fff
    style F fill:#2196F3,color:#fff
    style G fill:#4CAF50,color:#fff
```

### Phase 2: Batched Scene Generation

```mermaid
flowchart TD
    A[runBatchLoop] --> B{For each batch\nstartBatch to totalBatches}

    B --> C[buildContinuityContextCached\ncharacter registry + last 5 scenes]
    C --> D[buildScenePrompt]

    D --> D1[SYSTEM_INSTRUCTION\nexact count or content-aware]
    D --> D2[Pre-extracted characters\nfrom Phase 1]
    D --> D3[Cinematic profile\nfrom Phase 0]
    D --> D4[Media type instructions\nimage or video]
    D --> D5[Audio instructions\nper-layer on/off]
    D --> D6[Video segment info\ntime range + overlap]
    D --> D7[Negative prompt\nglobal + scene-specific]
    D --> D8[Continuity context\nprev scenes + characters]

    D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8 --> E[callGeminiAPIWithRetry\njittered exponential backoff]
    E --> F[parseGeminiResponse]
    F --> G[processSceneBatch]

    G --> G1[Assign scene IDs]
    G --> G2[Extract + merge characters]
    G --> G3[SSE: batchComplete event]

    G3 --> H{More batches?}
    H -->|Yes| B
    H -->|No| I[Return all scenes\n+ characterRegistry]

    style A fill:#2196F3,color:#fff
    style E fill:#FF9800,color:#fff
    style I fill:#9C27B0,color:#fff
```

### Scene Output Structure

```mermaid
classDiagram
    class Scene {
        +string id
        +number sequence
        +string mediaType
        +string description
        +string prompt
        +string negativePrompt
        +string character
        +string object
        +StyleObject style
        +VisualSpecs visual_specs
        +Lighting lighting
        +Composition composition
        +Technical technical
        +characterVariations
        +VideoSettings video
        +AudioSpec audio
        +DialogueSpec[] dialogue
        +EnhancedCameraPosition enhancedCamera
        +ExpressionControl expressionControl
        +EmotionalArc emotionalArc
        +LensEffects lensEffects
        +ColorGrading colorGrading
        +AdvancedLighting advancedLighting
    }

    class CharacterSkeleton {
        +string name
        +string gender
        +string age
        +string ethnicity
        +string bodyType
        +string faceShape
        +string hair
        +string facialHair
        +string distinctiveFeatures
        +string baseOutfit
        +string firstAppearance
    }

    class CinematicProfile {
        +EnrichedColorEntry[] dominantColors
        +colorTemperature
        +contrast
        +shadows
        +highlights
        +filmStock
        +mood
        +grain
        +postProcessing
    }

    Scene --> CharacterSkeleton : uses skeleton
    Scene --> CinematicProfile : uses color profile
```

### Auto-Retry Flow

```mermaid
flowchart TD
    A[Batch error occurs] --> B{Retryable?\nRATE_LIMIT / NETWORK / TIMEOUT}
    B -->|No| C[Show error to user]
    B -->|Yes| D{Attempt < 3?}
    D -->|No| C
    D -->|Yes| E[Calculate backoff\nBASE * 2^attempt, max cap]
    E --> F[Wait delay]
    F --> G[handleSubmit - resume mode]

    G --> G1[resumeJobId: same ID]
    G --> G2[resumeFromBatch: failed batch]
    G --> G3[existingScenes preserved]
    G --> G4[existingCharacters preserved]
    G --> G5[lastInteractionId\nGemini session continuity]

    G1 & G2 & G3 & G4 & G5 --> H[POST /api/prompt\nresume from failed batch]
    H --> I{Success?}
    I -->|Yes| J[Continue pipeline]
    I -->|No| A

    style A fill:#f44336,color:#fff
    style G fill:#FF9800,color:#fff
    style J fill:#4CAF50,color:#fff
```

### SSE Event Flow

```mermaid
sequenceDiagram
    participant Client as Client (page.tsx)
    participant API as API Route (route.ts)
    participant Gemini as Gemini API

    Client->>API: POST /api/prompt (SSE)
    API-->>Client: SSE: progress (Fetching metadata...)

    API->>Gemini: Video Analysis (Phase 0+1)
    Gemini-->>API: CinematicProfile + Characters
    API-->>Client: SSE: videoAnalysis
    API-->>Client: SSE: character (per character)
    API-->>Client: SSE: log (pending)
    API-->>Client: SSE: logUpdate (completed)

    loop For each batch
        API-->>Client: SSE: progress (Batch N/M)
        API-->>Client: SSE: log (pending)
        API->>Gemini: Scene generation (Phase 2)
        Gemini-->>API: Scene[] JSON
        API-->>Client: SSE: logUpdate (completed)
        API-->>Client: SSE: character (new ones)
        API-->>Client: SSE: batchComplete (scenes + chars)
    end

    API-->>Client: SSE: complete (all scenes, summary)
    Client->>Client: Save to D1 cache
```

### Data Persistence

```mermaid
flowchart LR
    subgraph Client
        A[Form Settings\nlocalStorage]
        B[In-flight Progress\nsessionStorage]
    end

    subgraph Server
        C[serverProgress Map\nin-memory]
        D[Event Tracker\nstream recovery]
    end

    subgraph Cloud
        E[Cloudflare D1\njob cache + resume]
    end

    A -->|persist preferences| A
    B -->|resume dialog on reload| B
    C -->|active job tracking| C
    D -->|SSE recovery| D
    E -->|compressed payloads\nTTL expiry| E

    B -.->|on submit| C
    C -.->|on batchComplete| E
    E -.->|on resume| C

    style E fill:#FF9800,color:#fff
```

---

## Project Structure

```mermaid
flowchart TD
    subgraph Pages
        P1[app/page.tsx\nChannel Analysis]
        P2[app/prompt/page.tsx\nVEO Pipeline]
        P3[app/report/page.tsx\nReport Display]
    end

    subgraph API_Routes[API Routes]
        A1[/api/analyze\nChannel analysis]
        A2[/api/prompt\nScene generation SSE]
        A3[/api/prompt/jobs\nJob CRUD + recovery]
        A4[/api/quota\nAPI quota check]
    end

    subgraph Core_Lib[Core Libraries]
        L1[lib/youtube.ts\nYouTube Data API]
        L2[lib/gemini.ts\nGemini AI - reports]
        L3[lib/cache.ts\nlocalStorage cache]
        L4[lib/retry.ts\nexponential backoff]
        L5[lib/logger.ts\nstructured logging]
    end

    subgraph Prompt_Lib[Prompt Pipeline]
        PL1[lib/prompt/prompts.ts\nAll prompt templates]
        PL2[lib/prompt/gemini.ts\nGemini API + retry]
        PL3[lib/prompt/types.ts\nType definitions]
        PL4[lib/prompt/constants.ts\nMagic numbers]
        PL5[lib/prompt/api/workflows.ts\nWorkflow orchestration]
        PL6[lib/prompt/api/batch-runner.ts\nBatch loop]
        PL7[lib/prompt/interactions.ts\nGemini Interactions API]
        PL8[lib/prompt/cache-remote.ts\nD1 cloud cache]
    end

    P1 --> A1
    P2 --> A2
    P2 --> A3
    A1 --> L1 & L2
    A2 --> PL5
    PL5 --> PL1 & PL2 & PL6
    PL6 --> PL2
    PL2 --> PL7
    A2 --> PL8
    A3 --> PL8

    style P1 fill:#4CAF50,color:#fff
    style P2 fill:#4CAF50,color:#fff
    style A1 fill:#2196F3,color:#fff
    style A2 fill:#2196F3,color:#fff
    style PL1 fill:#FF9800,color:#fff
    style PL5 fill:#FF9800,color:#fff
