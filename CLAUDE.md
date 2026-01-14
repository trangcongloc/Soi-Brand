# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OurTube is a YouTube marketing strategy analysis tool powered by AI (Google Gemini). It analyzes YouTube channels by fetching channel data and videos via the YouTube Data API v3, then generates comprehensive marketing reports including brand positioning, marketing funnel analysis, and content strategy insights.

## Essential Commands

### Development

```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking (no emit)
```

### Environment Setup

Create `.env.local` with required API keys:

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## Architecture

### Tech Stack

-   **Frontend**: Next.js 14 (App Router), React 18, TypeScript
-   **Backend**: Next.js API Routes (serverless)
-   **APIs**: YouTube Data API v3, Google Gemini Pro API (model: gemini-2.5-flash-lite)
-   **HTTP Client**: Axios
-   **Styling**: Vanilla CSS with modern UI design

### Project Structure

```
app/
├── api/analyze/route.ts    # Main API endpoint for channel analysis
├── layout.tsx              # Root layout with metadata
└── page.tsx                # Home page with state management

components/
├── AnalysisForm.tsx        # Input form for channel URL and file upload
├── LoadingState.tsx        # Loading indicator during analysis
└── ReportDisplay.tsx       # Report visualization and export

lib/
├── types.ts               # TypeScript type definitions for all data structures
├── youtube.ts             # YouTube Data API integration
├── gemini.ts              # Gemini AI integration for report generation
├── utils.ts               # Utility functions (URL parsing, UUID generation)
└── lang/                  # Internationalization
    ├── index.ts           # Language management
    └── vi.ts              # Vietnamese translations (default language)
```

### Data Flow

1. **User Input**: User submits YouTube channel URL via `AnalysisForm` or uploads existing JSON report
2. **API Route** (`/api/analyze`):
    - Validates URL format using `isValidYouTubeUrl()`
    - Extracts channel ID from various URL formats (channel ID, username, custom URL)
3. **YouTube Data Fetch** (`lib/youtube.ts`):
    - `resolveChannelId()`: Converts any URL format to channel ID
    - `getChannelInfo()`: Fetches channel metadata and statistics
    - `getChannelVideos()`: Retrieves up to 50 recent videos, filters to last 30 days (or top 10 if none)
4. **AI Analysis** (`lib/gemini.ts`):
    - `generateMarketingReport()`: Sends channel and video data to Gemini AI with structured prompt
    - Parses JSON response into `MarketingReport` structure
5. **Report Display**: `ReportDisplay` component renders comprehensive analysis with download capability

### Key Type Structures

**MarketingReport** (lib/types.ts:182-203) contains:

-   `report_part_1`: Raw channel info and video posts
-   `report_part_2`: AI-generated strategy analysis (ad strategy, funnel analysis, content pillars, quantitative metrics)
-   `report_part_3`: Insights (strengths, weaknesses, actionable recommendations, video ideas)

### Error Handling

The API route (`app/api/analyze/route.ts`) includes comprehensive error handling for:

-   **Gemini AI**: Model overload (503), rate limits (429), invalid API keys (500), JSON parsing errors
-   **YouTube API**: Quota exceeded (429), channel not found (404), invalid URLs (400)
-   **Network**: Connection errors (503), timeouts
-   All errors return structured `AnalyzeResponse` with `errorType` for client-side handling

Error messages are localized in Vietnamese (lib/lang/vi.ts).

### Language System

The app uses a centralized language system (lib/lang/):

-   Currently Vietnamese-only (`vi.ts` is the default)
-   `useLang()` hook provides translations throughout the app
-   Structured for easy expansion to additional languages
-   Includes metadata, form labels, errors, and UI text

## Development Notes

### YouTube API Considerations

-   Video filtering prioritizes last 30 days, falls back to 10 most recent if no recent videos
-   Channel ID resolution supports multiple URL formats: `/channel/{id}`, `/@username`, `/c/{customUrl}`, `/user/{username}`
-   API quota limits apply (10,000 units/day for free tier)

### Gemini AI Integration

-   Model: `gemini-2.5-flash-lite` for cost-efficiency and speed
-   Prompt engineering in `lib/gemini.ts:47-189` defines exact JSON structure
-   Response parsing handles markdown code block wrappers (```json)
-   Retry logic for transient errors recommended at application level

### State Management

-   Client-side state managed with React hooks in `app/page.tsx`
-   No global state library (Redux, Zustand) needed for current scope
-   Report data can be uploaded/downloaded as JSON for offline analysis

### Path Aliases

The project uses `@/*` path alias mapping to root directory (configured in tsconfig.json:20-22).

## Deployment

Optimized for Vercel deployment:

-   Ensure environment variables are configured in Vercel dashboard
-   Serverless API routes scale automatically
-   No additional configuration needed for production builds
