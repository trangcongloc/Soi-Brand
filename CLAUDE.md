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
