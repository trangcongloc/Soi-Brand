# CLAUDE.md

Instructions for Claude Code when working with this repository.

## Project Overview

Soi'Brand is a YouTube marketing strategy analysis tool powered by Google Gemini AI. It analyzes YouTube channels via the YouTube Data API v3 and generates marketing reports including brand positioning, funnel analysis, and content strategy insights.

## Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run test         # Jest tests
npm run validate     # All checks (type-check + lint + test)
```

## Environment

Create `.env.local`:
```env
YOUTUBE_API_KEY=your_key
GEMINI_API_KEY=your_key
```

## Architecture

### Tech Stack
- Next.js 14 (App Router), React 18, TypeScript
- Google Gemini API, YouTube Data API v3
- Framer Motion, Recharts

### Project Structure

```
app/
├── api/
│   ├── analyze/route.ts      # Main analysis endpoint
│   ├── quota/route.ts        # API quota check
│   └── loading-labels/route.ts
├── layout.tsx
└── page.tsx

components/
├── AnalysisForm.tsx          # URL input form
├── LoadingState.tsx          # Loading indicator
├── ReportDisplay.tsx         # Report container
├── SettingsButton.tsx        # Settings panel
├── SplashScreen.tsx          # Initial splash
├── ErrorBoundary.tsx
├── LanguageProvider.tsx
├── VideoPerformanceChart.tsx
└── report/
    ├── AnalysisTab.tsx       # Marketing analysis
    ├── DataTab.tsx           # Raw data view
    └── EvaluationTab.tsx     # Insights tab

lib/
├── gemini.ts                 # Gemini AI integration
├── youtube.ts                # YouTube API integration
├── types.ts                  # TypeScript definitions
├── utils.ts                  # Utilities
├── config.ts                 # Configuration
├── cache.ts                  # Caching
├── retry.ts                  # Retry logic
├── apiQuota.ts               # Quota management
├── apiValidation.ts          # Validation
├── prompts/
│   └── marketing-report.ts   # AI prompt template
└── lang/
    ├── index.ts              # Language management
    ├── vi.ts                 # Vietnamese
    └── en.ts                 # English
```

### Data Flow

1. User submits YouTube channel URL
2. `/api/analyze` validates and extracts channel ID
3. `lib/youtube.ts` fetches channel data and videos
4. `lib/gemini.ts` generates marketing analysis
5. Report displayed in tabbed interface

### Key Types

`MarketingReport` (lib/types.ts):
- `report_part_1`: Channel info and video data
- `report_part_2`: Strategy analysis (funnel, content pillars, SEO, audience)
- `report_part_3`: Insights and action plans

## Development Notes

- Videos filtered to last 30 days (fallback to top 10)
- Supports URL formats: `/channel/ID`, `/@username`, `/c/custom`, `/user/username`
- Vietnamese is default language
- Path alias: `@/*` maps to root

## Claude Code Setup

This project uses [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - a production-ready configuration collection for Claude Code CLI.

### Installed Components (Global)

Location: `~/.claude/`

**9 Specialized Agents:**
- `planner` - Feature implementation planning
- `architect` - System design decisions
- `code-reviewer` - Code quality and security review
- `security-reviewer` - Vulnerability analysis
- `tdd-guide` - Test-driven development enforcement
- `build-error-resolver` - Build error diagnosis and fixes
- `e2e-runner` - End-to-end testing with Playwright
- `refactor-cleaner` - Dead code removal
- `doc-updater` - Documentation synchronization

**10 Workflow Commands:**
- `/plan` - Create implementation plan
- `/tdd` - Enforce test-first development
- `/code-review` - Quality review current code
- `/security-review` - Security audit
- `/build-fix` - Fix build errors
- `/e2e` - Generate E2E tests
- `/test-coverage` - Coverage analysis
- `/refactor-clean` - Clean up dead code
- `/update-docs` - Update documentation
- `/update-codemaps` - Update code maps

**8 Rule Categories:**
- `security.md` - Security protocols and secret management
- `coding-style.md` - Code formatting and conventions
- `testing.md` - TDD workflow, 80% coverage requirement
- `git-workflow.md` - Commit format, PR process
- `agents.md` - When to delegate to specialized agents
- `patterns.md` - Design patterns and best practices
- `performance.md` - Model selection, context optimization
- `hooks.md` - Hook configuration guide

**Active Hooks:**

*PreToolUse:*
- Blocks `npm run dev` outside tmux (use: `tmux new -s dev 'npm run dev'`)
- Suggests tmux for long-running commands (install, test, build)
- Pauses before `git push` for review
- Blocks random `.md` file creation (use README.md)

*PostToolUse:*
- Auto-formats JS/TS files with Prettier after edits
- Runs TypeScript check after `.ts`/`.tsx` edits
- Warns about `console.log` statements
- Logs PR URLs after `gh pr create`

*Stop (session end):*
- Final `console.log` audit in modified files
- Session state persistence

### Usage Guidelines

**When to use agents:**
- Complex features → `/plan` or use `planner` agent
- After writing code → `/code-review` or `code-reviewer` agent
- Before commits → `security-reviewer` agent
- Build failures → `build-error-resolver` agent
- New features/bugs → `/tdd` or `tdd-guide` agent

**Best practices:**
- **Security:** No hardcoded API keys, validate all inputs, check OWASP top 10
- **Testing:** Write tests first (RED → GREEN → REFACTOR), 80% minimum coverage
- **Git:** Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`)
- **Code style:** Immutability (never mutate objects), small files (200-400 lines)

**Model selection:**
- Sonnet 4.5 (default) - Main development work
- Haiku 4.5 - Lightweight tasks, cost savings
- Opus 4.5 - Complex architecture decisions

**Context window management:**
- Keep <10 MCPs active per project
- Disable unused MCPs in `~/.claude.json` with `disabledMcpServers`
- Your 200k context can shrink to ~70k with too many tools enabled

### Project-Specific Patterns

**AI Integration:**
- Gemini streaming responses: `lib/gemini.ts`
- YouTube API quota management: `lib/apiQuota.ts`
- Retry logic with exponential backoff: `lib/retry.ts`
- Caching strategy: `lib/cache.ts`

**Next.js patterns:**
- App Router API routes: `app/api/*/route.ts`
- Server-side validation: `lib/apiValidation.ts`
- Client components: Framer Motion animations
- Error boundaries: `components/ErrorBoundary.tsx`

**Internationalization:**
- Language management: `lib/lang/index.ts`
- Vietnamese (default): `lib/lang/vi.ts`
- English: `lib/lang/en.ts`

### Backup & Recovery

**Factory reset backup location:**
```bash
~/claude-backup-20260121-123621/
```

To restore specific configs:
```bash
cp ~/claude-backup-*/CLAUDE.md ~/.claude/
cp ~/claude-backup-*/.claude/rules/security.md ~/.claude/rules/
```

### References

- Repository: https://github.com/affaan-m/everything-claude-code
- License: MIT
- Created by: Anthropic Hackathon Winner (10+ months production use)
