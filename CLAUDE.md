# CLAUDE.md

Instructions for Claude Code when working with this repository.

---

## ⛔ NEVER (Hard Stop Rules)

Read this block FIRST. These are absolute. No exceptions, no justification needed.

- **NEVER** create utility functions outside `lib/`
- **NEVER** use `any` type — use `unknown` + type guards or proper types
- **NEVER** hardcode values that belong in constants or env
- **NEVER** skip error handling in async functions
- **NEVER** commit without running `npm run validate`
- **NEVER** duplicate a function that already exists — search first
- **NEVER** use `console.log` in production code — use the logging pattern below
- **NEVER** create a component over 400 lines — split it
- **NEVER** import from a sibling component's internal file directly
- **NEVER** write `// @ts-ignore` or `// @ts-expect-error` without a documented reason

---

## ⚡ MANDATORY: Before Writing ANY Code

This is NOT a checklist. Claude MUST execute these steps. Every time. No skipping.

### Step 1 — Search for existing code

```bash
# MUST run before creating any function/util/component
grep -rn "functionName\|ClassName\|hookName" lib/ components/ app/
```

If a match is found → **reuse or extend it**. Do NOT create a new one.

### Step 2 — Read context (minimum 50 lines)

Find the most similar existing file. Read it. Understand the pattern. Follow it exactly.

### Step 3 — Check the lookup tables below

| Need this?                | Check here FIRST                         |
| ------------------------- | ---------------------------------------- |
| URL extraction / parsing  | `lib/utils.ts`, `lib/veo/utils.ts`       |
| Retry / backoff           | `lib/retry.ts`                           |
| Caching                   | `lib/cache.ts`, `lib/veo/phase-cache.ts` |
| Constants / magic numbers | `lib/veo/constants.ts`, `lib/config.ts`  |
| Error handling patterns   | `lib/errorMappings.ts`                   |
| Types / interfaces        | `lib/types.ts`, `lib/veo/types.ts`       |
| Validation / Zod schemas  | `lib/apiValidation.ts`                   |
| i18n / language strings   | `lib/lang/vi.ts`, `lib/lang/en.ts`       |
| API key validation        | `lib/apiValidation.ts`                   |

### Step 4 — If creating something NEW, justify it

If no existing code covers your need, state WHY before writing. One sentence minimum.
Example: _"No existing retry utility supports streaming SSE connections, so creating `lib/veo/sse-retry.ts`"_

---

## 🚫 Forbidden Practices (Audit-Based)

### Rule 1: No Duplicate Utilities

**Found violation:** `extractVideoId` existed in both `components/veo/VeoUrlInput.tsx` (local) and `lib/veo/utils.ts` (canonical).

**Rule:** Always import from `lib/`. Never recreate locally.

```typescript
// ❌ WRONG
function extractVideoId(url: string) { ... }

// ✅ CORRECT
import { extractVideoId } from '@/lib/veo/utils';
```

### Rule 2: No `any` Types

**Audit status:** ~9 instances remain in `lib/` (down from 30+). Continue eliminating.

```typescript
// ❌ WRONG
} catch (error: any) { console.error(error.message); }

// ✅ CORRECT
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
}
```

### Rule 3: No Magic Numbers

**Found violation:** `setTimeout(..., 2000)` repeated 6+ times.

**Decision tree for where to put constants:**

```
Is it shared across multiple features?
  → YES → lib/config.ts
  → NO → Is it specific to VEO?
           → YES → lib/veo/constants.ts
           → NO → Is it used in only ONE component?
                    → YES → const at top of that file (NOT exported)
                    → NO → lib/config.ts
```

```typescript
// ❌ WRONG
setTimeout(() => setCopied(false), 2000);

// ✅ CORRECT — import if shared
import { UI_COPY_STATUS_TIMEOUT_MS } from "@/lib/veo/constants";
setTimeout(() => setCopied(false), UI_COPY_STATUS_TIMEOUT_MS);

// ✅ ALSO OK — single-component-only constant at module top
const COPY_RESET_MS = 2000; // only used in this file
```

### Rule 4: Consistent Error Handling

**Two patterns exist. Pick the correct one based on context.**

#### Pattern A: General async functions (`lib/`, hooks, utilities)

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error instanceof Error) {
    console.error("Operation failed:", error.message); // REMOVE in production — see logging rules
    throw new Error(`[context]: ${error.message}`);
  }
  throw new Error("[context]: Unknown error");
}
```

#### Pattern B: Next.js API Routes (`app/api/**`)

```typescript
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // validate input first
    const body = await req.json();
    // ... business logic
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: error instanceof ValidationError ? 400 : 500 });
  }
}
```

**Rule:** API routes MUST return `NextResponse`. Never throw raw errors from API routes.

### Rule 5: Follow Existing Constants Pattern

```typescript
// lib/veo/constants.ts — reference model
export const CACHE_TTL_DAYS = 7;
export const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000; // derive, don't repeat
export const DEFAULT_API_TIMEOUT_MS = 300000;
export const SSE_KEEPALIVE_INTERVAL_MS = 15000;
```

**Rule:** Derive related constants from each other. Never have `CACHE_TTL_DAYS = 7` and `CACHE_TTL_MS = 604800000` separately.

---

## 📦 Import Path Convention

**MUST follow this order. No exceptions.**

```typescript
// 1. External packages first
import { useState, useEffect } from "react";
import { NextResponse } from "next/server";

// 2. Path-alias imports (@/) — lib, components, app
import { extractVideoId } from "@/lib/veo/utils";
import { AnalysisForm } from "@/components/AnalysisForm";

// 3. Relative imports ONLY for files in the same directory
import { helper } from "./helper";

// ❌ WRONG — never go up directories with relative paths
import { something } from "../../lib/utils";

// ✅ CORRECT — use @/ alias instead
import { something } from "@/lib/utils";
```

**Rule:** If you need to go up more than one directory (`../..`), you MUST use `@/` alias.

---

## 🏗️ Next.js Component Rules

### Server vs Client — Decision Tree

```
Does this component need:
  useState / useEffect / event handlers / browser APIs?
    → YES → 'use client' at top of file
    → NO  → Server Component (default, no directive needed)

Does this component fetch data?
    → YES, and it's a page/layout → Server Component, fetch directly
    → YES, and it's interactive  → useEffect + client fetch, OR use a Server parent
```

### Component File Structure (template)

```typescript
// 1. Directive (if needed)
'use client';

// 2. Imports (follow import order rules above)
import { useState } from 'react';
import { SOME_CONSTANT } from '@/lib/veo/constants';
import type { SomeType } from '@/lib/types';

// 3. Module-level constants (non-exported, single-file only)
const LOCAL_TIMEOUT_MS = 3000;

// 4. Types/interfaces for this file
interface Props {
  title: string;
  onSubmit: (data: FormData) => Promise<void>;
}

// 5. Main component (default export)
export default function MyComponent({ title, onSubmit }: Props) {
  // hooks first
  const [state, setState] = useState<string>('');

  // handlers
  const handleSubmit = async () => { ... };

  // render
  return (
    <div>...</div>
  );
}

// 6. Sub-components (if small, < 30 lines each)
function SubComponent({ ... }) { ... }
```

**Rule:** If file exceeds 400 lines, extract sub-components into their own files.

---

## 🗄️ Utility Registry

**ALWAYS check here before creating anything new.**

### General Utilities (`lib/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `utils.ts` | `extractChannelId`, `extractUsername`, `isValidYouTubeUrl`, `generateUUID`, `downloadJSON`, `isBrowser` | General utilities |
| `logger.ts` | `logger` | Structured logging with levels |
| `retry.ts` | `withRetry<T>` | Exponential backoff retry |
| `cache.ts` | `LocalStorageCache<T>` | Generic TTL-based cache |
| `cache-manager.ts` | `LocalStorageCache` class | Cache manager with max items |
| `errorMappings.ts` | Error type mappings | Error classification |
| `error-handler.ts` | Error handling utilities | Standardized error responses |
| `apiValidation.ts` | `AnalyzeRequestSchema`, `validateYouTubeApiKey`, `validateGeminiApiKey` | Zod schemas + key validation |
| `schemas.ts` | Additional Zod schemas | Extended validation |
| `rateLimit.ts` | Rate limiting utilities | API rate limiting |
| `crypto.ts` | Encryption utilities | Client-side key obfuscation |
| `config.ts` | Shared configuration | App-wide constants |
| `userSettings.ts` | User settings management | Preferences persistence |

### VEO Pipeline (`lib/veo/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `utils.ts` | `extractVideoId`, `isValidYouTubeUrl`, `generateJobId`, `parseDuration`, `formatTime`, `getYouTubeThumbnail`, `cleanScriptText` | **Core VEO utilities — USE THESE** |
| `types.ts` | `Scene`, `CachedVeoJob`, `VeoJobSummary`, `GeneratedScript`, etc. | Type definitions |
| `constants.ts` | All VEO constants | **REFERENCE THIS for magic numbers** |
| `gemini.ts` | `callGeminiAPIWithRetry`, `parseGeminiResponse` | Gemini API integration (jittered retry with 30s max delay) |
| `prompts.ts` | `buildContinuityContext`, `buildContinuityContextCached`, `resetContinuityCache` | AI prompts + cached continuity context |
| `cache.ts` | `setCachedJob`, `getCachedJob` | Async cache facade (D1 + localStorage) |
| `cache-local.ts` | `setCachedJobLocal`, `getCachedJobLocal` | Local storage caching |
| `cache-remote.ts` | Cloud sync utilities | D1 database integration |
| `phase-cache.ts` | Phase-based caching | Multi-phase job caching |
| `d1-client.ts` | D1 API client | Cloudflare D1 operations |
| `auth.ts` | VEO authentication | Database key validation |
| `validation.ts` | VEO-specific validation | Input validation |
| `colorMapper.ts` | Color mapping utilities | Color profile processing |
| `colorVocabulary.ts` | Color vocabulary | Color naming/matching |
| `scene-processor.ts` | Scene processing | Scene data transformation |
| `progress.ts` | Progress tracking | Job progress management |
| `settings.ts` | VEO settings | Feature configuration |
| `storage-utils.ts` | Storage utilities | Cross-storage operations |
| `browser-utils.ts` | Browser utilities | Client-side helpers |
| `download-utils.ts` | Download utilities | Export/download features |
| `templates.ts` | VEO templates | Preset configurations |

### i18n (`lib/lang/`)

- `useLang()` hook or language provider — all user-facing strings MUST go through i18n
- Vietnamese (`vi.ts`) is default
- **NEVER hardcode Vietnamese or English strings in components**

### ⊕ How to Add a New Utility

1. Decide location using the constants decision tree above
2. Write the function in the correct `lib/` file
3. Export it
4. **Update this Registry section** with the new function signature
5. If it replaces an existing function, mark the old one as `@deprecated`

---

## 🔒 Environment & Configuration

### Required env variables (`/.env.local`)

```env
YOUTUBE_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### Validation Rule

**API routes MUST validate that required env vars exist before using them.**

```typescript
// ✅ CORRECT — validate at the top of API route
const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  return NextResponse.json({ error: "YOUTUBE_API_KEY is not configured" }, { status: 500 });
}
```

**Rule:** Never let `undefined` env vars propagate silently into API calls. Fail fast with a clear error.

---

## 📝 Logging Rules

**Use `lib/logger.ts` — NOT raw `console.log`.**

```typescript
import { logger } from "@/lib/logger";

// Available methods (respects LOG_LEVEL env var):
logger.info("Processing request", { jobId });    // Info level
logger.warn("Deprecated method used", { method }); // Warning
logger.error("Operation failed", error);          // Error (always message, stack in verbose)
logger.verbose("Full debug data", details);       // Verbose only

// DON'T do this:
console.log("debug:", data);  // ❌ Use logger instead
```

**Log levels** (set `LOG_LEVEL` in `.env.local`):
- `silent` — No logs
- `error` — Errors only (production default)
- `info` — Info + warnings + errors (development default)
- `verbose` — Everything including debug details

**API route errors:** Return error in `NextResponse`, use `logger.error()` for server-side logging.

**Rationale:** Logger respects environment, prevents production log leakage, and provides consistent formatting.

---

## 📊 Testing Patterns

### What to test where

| Layer                           | Test type        | Tool                           | Example                             |
| ------------------------------- | ---------------- | ------------------------------ | ----------------------------------- |
| `lib/utils.ts` — pure functions | Unit test        | Jest                           | `extractVideoId` with 5 URL formats |
| `lib/retry.ts` — async logic    | Unit test + mock | Jest + jest.fn                 | Mock failing fn, verify retry count |
| `app/api/*` — API routes        | Integration      | Jest + supertest or fetch mock | POST with valid/invalid body        |
| `components/*` — UI             | Component test   | Jest + React Testing Library   | Render + simulate user action       |
| Full flow — user → result       | E2E              | Playwright (`/e2e` agent)      | Submit URL → see report             |

### Rule: 80% coverage minimum on `lib/`

All utility functions and core logic MUST have tests. Components are secondary priority.

---

## 🏢 Project Overview

Soi'Brand — YouTube marketing strategy analysis tool powered by Google Gemini AI.
Analyzes YouTube channels via YouTube Data API v3 → generates marketing reports (brand positioning, funnel analysis, content strategy).

### Commands

```bash
npm run dev           # Dev server (localhost:3000)
npm run build         # Production build
npm run lint          # ESLint
npm run type-check    # TypeScript check
npm run test          # Jest
npm run test:coverage # Jest with coverage report (80% minimum on lib/)
npm run validate      # All checks (type-check + lint + test) — run before EVERY commit
```

### Tech Stack

Next.js 14 (App Router) · React 18 · TypeScript · Google Gemini API · YouTube Data API v3 · Framer Motion · Recharts

### Project Structure

```
app/
├── api/
│   ├── analyze/route.ts        # Main analysis endpoint
│   ├── quota/route.ts          # API quota check
│   ├── veo/route.ts            # VEO video analysis
│   └── loading-labels/route.ts
├── veo/page.tsx                # VEO feature page
├── layout.tsx
└── page.tsx

components/
├── AnalysisForm.tsx
├── LoadingState.tsx
├── ReportDisplay.tsx
├── SettingsButton.tsx
├── SplashScreen.tsx
├── ErrorBoundary.tsx
├── LanguageProvider.tsx
├── VideoPerformanceChart.tsx
├── veo/                        # VEO components
│   ├── VeoUrlInput.tsx
│   ├── VeoSceneCard.tsx
│   ├── VeoHistoryPanel.tsx
│   └── ...
└── report/
    ├── AnalysisTab.tsx
    ├── DataTab.tsx
    └── EvaluationTab.tsx

lib/
├── gemini.ts                   # Gemini AI integration
├── youtube.ts                  # YouTube API integration
├── types.ts                    # Root types
├── utils.ts                    # General utilities
├── config.ts                   # Shared constants
├── cache.ts                    # Caching logic
├── retry.ts                    # Retry / backoff
├── apiQuota.ts                 # Quota management
├── apiValidation.ts            # Zod schemas + key validation
├── errorMappings.ts            # Error type mappings
├── veo/
│   ├── types.ts
│   ├── constants.ts            # VEO constants (REFERENCE THIS)
│   ├── utils.ts                # VEO utilities
│   ├── gemini.ts               # VEO Gemini calls
│   ├── prompts.ts              # VEO AI prompts
│   └── phase-cache.ts          # Phase-based caching
├── prompts/
│   └── marketing-report.ts     # AI prompt template
└── lang/
    ├── index.ts                # Language manager
    ├── vi.ts                   # Vietnamese (default)
    └── en.ts                   # English
```

### Data Flow

```
User submits YouTube URL
  → /api/analyze validates + extracts channel ID
    → lib/youtube.ts fetches channel data + videos
      → lib/gemini.ts generates marketing analysis
        → Report rendered in tabbed interface
```

### Key Types (`lib/types.ts`)

`MarketingReport`:

- `report_part_1` — Channel info + video data
- `report_part_2` — Strategy (funnel, content pillars, SEO, audience)
- `report_part_3` — Insights + action plans

---

## 🔄 Development Workflows

### A. Bug Fix Pipeline

```
1. Read error message + stack trace
2. grep to locate the file
3. Read 100+ lines of surrounding context
4. Identify root cause
5. Search for similar fixes elsewhere in codebase
6. Apply minimal fix — NO refactoring unless required
7. Run: npm run validate
8. Commit: fix(scope): description
```

### B. New Feature Pipeline

```
1.  /plan — Create implementation plan
2.  Read minimum 3 related files
3.  Identify patterns to follow
4.  /tdd — Write tests first (RED → GREEN → REFACTOR)
5.  Implement following existing patterns
6.  /code-review — Review code quality
7.  /security-review — Check for vulnerabilities
8.  Run: npm run validate
9.  Commit: feat(scope): description
```

### C. VEO-Specific Pipeline

```
1. Check lib/veo/types.ts for type definitions
2. Check lib/veo/constants.ts for constants
3. Check lib/veo/utils.ts for existing utilities
4. Follow SSE event pattern for streaming
5. Use lib/veo/phase-cache.ts for caching
6. Run: npm run test -- veo
7. /code-review before commit
```

### D. Adding a New Utility (NEW)

```
1. Confirm no existing function does this (grep lib/)
2. Decide file location using constants decision tree
3. Write function + export
4. Write unit tests (minimum 3 test cases)
5. Update Utility Registry in this CLAUDE.md
6. Run: npm run validate
7. Commit: feat(lib): add utilityName
```

---

## 🤖 Claude Code Agents

### Installed Agents (global at `~/.claude/`)

| Agent                  | When to use                                          |
| ---------------------- | ---------------------------------------------------- |
| `planner`              | Before starting any new feature                      |
| `architect`            | When making system-level design decisions            |
| `code-reviewer`        | After writing any new code — MANDATORY before commit |
| `security-reviewer`    | Before every commit. Non-negotiable.                 |
| `tdd-guide`            | When writing tests                                   |
| `build-error-resolver` | When `npm run build` fails                           |
| `e2e-runner`           | After feature is complete — full flow test           |
| `refactor-cleaner`     | When a file exceeds 400 lines or has dead code       |
| `doc-updater`          | After adding new features or changing architecture   |

### Workflow Commands

```
/plan              — Implementation planning
/tdd               — Test-first development
/code-review       — Code quality check
/security-review   — Security audit
/build-fix         — Diagnose + fix build errors
/e2e               — E2E test generation
/test-coverage     — Coverage analysis
/refactor-clean    — Remove dead code
/update-docs       — Sync documentation
/update-codemaps   — Update code maps
```

### Model Selection

```
claude-sonnet-4-5  → Default. All general development work.
claude-haiku-4-5   → Lightweight tasks: formatting, small fixes, quick searches.
claude-opus-4-5    → Architecture decisions, complex refactors ONLY.
```

---

## ✅ Self-Review Checklist (Claude runs this BEFORE delivering code)

Before handing code back, Claude MUST verify:

```
□ Did I search for existing functions before creating new ones?
□ Are all imports using @/ alias (no ../../ paths)?
□ Are there any `any` types? → Replace with proper types
□ Are there magic numbers? → Extract to constants
□ Is error handling present in all async functions?
□ Do API routes return NextResponse (not raw throws)?
□ Are env vars validated before use in API routes?
□ Is file under 400 lines? If not → split
□ Did I add i18n keys for any user-facing strings?
□ Are there console.log statements? → Remove or wrap in dev check
□ Does npm run validate pass?
```

If ANY box is unchecked → fix before delivering.

---

## 📌 Development Notes

- Videos filtered to last 30 days (fallback: top 10 by view count)
- YouTube URL formats supported: `/channel/ID`, `/@username`, `/c/custom`, `/user/username`
- Vietnamese is default language — all new strings go to `lib/lang/vi.ts` first
- Path alias: `@/*` maps to project root
- This project uses [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
