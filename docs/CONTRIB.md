# Contributing to Soi'Brand

Development workflow, setup, and testing procedures.

> **Source of truth**: `package.json`, `.env.example`
> **Last updated**: 2026-01-31

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server at localhost:3000 |
| `build` | `next build` | Create production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | Run ESLint checks |
| `type-check` | `tsc --noEmit` | TypeScript type checking |
| `test` | `jest` | Run all tests |
| `test:watch` | `jest --watch` | Run tests in watch mode |
| `test:coverage` | `jest --coverage` | Run tests with coverage report |
| `clean` | `rm -rf .next tsconfig.tsbuildinfo` | Clean build artifacts |
| `clean:all` | `rm -rf .next node_modules tsconfig.tsbuildinfo package-lock.json` | Full clean including dependencies |
| `validate` | `npm run type-check && npm run lint && npm run test` | Run all checks (CI) |
| `analyze` | `ANALYZE=true next build` | Build with bundle analyzer |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YOUTUBE_API_KEY` | Yes | YouTube Data API v3 key. Get at [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key. Get at [AI Studio](https://aistudio.google.com/app/apikey) |
| `NODE_ENV` | No | Environment: `development`, `production`, `test`. Default: `development` |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed CORS origins for production |
| `LOG_LEVEL` | No | Logging level: `silent`, `error`, `info`, `verbose`. Default: `info` (dev), `error` (prod) |
| `NEXT_PUBLIC_ENCRYPTION_SALT` | No | Custom salt for client-side API key encryption (obfuscation) |

## Development Workflow

### 1. Before Starting
```bash
npm run validate  # Ensure clean state
```

### 2. Development
```bash
npm run dev  # Start dev server
```

### 3. Before Committing
```bash
npm run validate  # Run all checks
```

### 4. Commit Format
Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance
- `perf:` - Performance improvement

## Testing

### Run Tests
```bash
npm run test           # Single run
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

### Test Structure
```
__tests__/
├── lib/
│   ├── cache.test.ts
│   ├── logger.test.ts
│   ├── retry.test.ts
│   ├── utils.test.ts
│   └── youtube.test.ts
```

### Coverage Target
Minimum 80% coverage required.

### Testing Best Practices

#### LocalStorageCache Mock Structure

When testing code that uses `LocalStorageCache<T>`, remember that items are wrapped in a `CachedItem` structure:

```typescript
// Storage format in localStorage
{
  data: T,           // Your actual data
  timestamp: number  // Cache timestamp
}

// getAll() returns
Array<{
  id: string,        // Item ID (without prefix)
  data: T,           // Your actual data
  timestamp: number  // Cache timestamp
}>
```

**Test Helper Pattern:**

```typescript
// ✅ CORRECT - Wrap data in CachedItem structure
function storeJob(job: CachedVeoJob): void {
  const key = `veo_job_${job.jobId}`;
  const cachedItem = {
    data: job,
    timestamp: job.timestamp,
  };
  localStorageData[key] = JSON.stringify(cachedItem);
}

// ❌ WRONG - Missing wrapper
function storeJob(job: CachedVeoJob): void {
  const key = `veo_job_${job.jobId}`;
  localStorageData[key] = JSON.stringify(job);  // Missing wrapper!
}
```

#### React Hooks Testing

When testing components with `useCallback` or `useMemo`:

1. **Complete dependency arrays** - Include all variables used inside the hook
2. **Memoize complex objects** - Use `useMemo` for objects used in callbacks
3. **Stable identities** - Avoid creating objects inline in dependency arrays

Example:
```typescript
// ✅ GOOD - Memoized object with stable identity
const data = useMemo(() => ({
  id,
  name,
  items
}), [id, name, items]);

const handler = useCallback(() => {
  process(data);
}, [data]);

// ❌ BAD - Object recreated on every render
const data = { id, name, items };
const handler = useCallback(() => {
  process(data);
}, [data]);  // Triggers re-creation on every render
```

## Code Quality

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` + type guards)
- All exports must be typed

### Linting
```bash
npm run lint  # Check for issues
```

### Style Guidelines
- Immutability: Never mutate objects, always create new ones
- Small files: 200-400 lines typical, 800 max
- Single responsibility: One concern per file

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| UI | React 18, Framer Motion |
| Charts | Recharts |
| AI | Google Gemini API |
| Data | YouTube Data API v3 |
| Validation | Zod |
| Testing | Jest, Testing Library |

## Project Structure

```
app/
├── api/           # API routes
├── layout.tsx     # Root layout
└── page.tsx       # Home page

components/        # React components
lib/              # Utilities and services
__tests__/        # Test files
docs/             # Documentation
```

## Getting Help

- Check `CLAUDE.md` for AI assistant context
- See `docs/RUNBOOK.md` for operations guide
- Review `docs/roadmap.md` for planned features
