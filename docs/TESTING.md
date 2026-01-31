# Testing Guide

Comprehensive guide for writing and maintaining tests in Soi'Brand.

> **Last updated**: 2026-01-31

## Quick Start

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Full validation (type-check + lint + test)
npm run validate
```

---

## Test Structure

```
__tests__/
├── lib/
│   ├── cache.test.ts           # Marketing report cache
│   ├── logger.test.ts          # Logging utilities
│   ├── rateLimit.test.ts       # API rate limiting
│   ├── retry.test.ts           # Retry logic
│   ├── utils.test.ts           # General utilities
│   ├── youtube.test.ts         # YouTube API
│   └── veo/
│       ├── cache.test.ts       # VEO job cache
│       ├── colorMapper.test.ts # Color mapping
│       ├── progress.test.ts    # Progress tracking
│       └── utils.test.ts       # VEO utilities
```

---

## Coverage Requirements

**Minimum:** 80% across all metrics (statements, branches, functions, lines)

**Current Status:**
- ✅ 307 tests passing
- ✅ 10 test suites passing
- ✅ All validation checks passing

---

## Writing Tests

### Test-Driven Development (TDD)

Follow the RED → GREEN → REFACTOR cycle:

1. **RED** - Write a failing test
2. **GREEN** - Write minimal code to pass
3. **REFACTOR** - Improve while keeping tests green

Example:
```typescript
// 1. RED - Write failing test
it('should calculate liquidity score', () => {
  const score = calculateLiquidityScore({ volume: 1000 });
  expect(score).toBeGreaterThan(0);
});

// 2. GREEN - Minimal implementation
export function calculateLiquidityScore({ volume }) {
  return volume / 100;
}

// 3. REFACTOR - Improve
export function calculateLiquidityScore(market: MarketData): number {
  if (market.volume === 0) return 0;
  return Math.min(market.volume / 100, 100);
}
```

### Test Structure

```typescript
describe('FeatureName', () => {
  // Setup
  beforeEach(() => {
    // Initialize mocks, reset state
  });

  // Happy path
  it('should handle normal case', () => {
    // Arrange
    const input = createTestData();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toEqual(expected);
  });

  // Edge cases
  it('should handle empty input', () => { });
  it('should handle null values', () => { });

  // Error cases
  it('should throw on invalid input', () => {
    expect(() => functionUnderTest(null)).toThrow();
  });
});
```

---

## Testing LocalStorageCache

**Critical:** `LocalStorageCache<T>` wraps all cached items in a `CachedItem` structure.

### Storage Format

```typescript
// What's stored in localStorage
{
  data: T,           // Your actual data
  timestamp: number  // When it was cached
}

// What getAll() returns
Array<{
  id: string,        // Item ID without prefix
  data: T,           // Your actual data
  timestamp: number  // Cache timestamp
}>
```

### Test Helper Pattern

```typescript
// ✅ CORRECT - Wrap data properly
function storeJob(job: CachedVeoJob): void {
  const key = `veo_job_${job.jobId}`;
  const cachedItem = {
    data: job,              // Actual job data
    timestamp: job.timestamp
  };
  localStorageData[key] = JSON.stringify(cachedItem);
}

// ❌ WRONG - Missing wrapper
function storeJob(job: CachedVeoJob): void {
  const key = `veo_job_${job.jobId}`;
  localStorageData[key] = JSON.stringify(job);  // Missing CachedItem wrapper!
}
```

### Complete Example

```typescript
import { getCachedJob } from '@/lib/veo/cache';

describe('VEO Cache', () => {
  let localStorageData: Record<string, string>;

  beforeEach(() => {
    localStorageData = {};

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => localStorageData[key] || null),
        setItem: jest.fn((key, value) => {
          localStorageData[key] = value;
        }),
      },
    });
  });

  it('returns cached job when it exists', () => {
    // Arrange - Store with CachedItem wrapper
    const mockJob = {
      jobId: 'test-123',
      videoId: 'abc',
      timestamp: Date.now(),
    };

    localStorageData['veo_job_test-123'] = JSON.stringify({
      data: mockJob,      // ✅ Wrapped in CachedItem
      timestamp: mockJob.timestamp
    });

    // Act
    const result = getCachedJob('test-123');

    // Assert
    expect(result).not.toBeNull();
    expect(result!.jobId).toBe('test-123');
  });
});
```

---

## Testing React Hooks

### useCallback Dependencies

**Rule:** Include ALL variables used inside the callback.

```typescript
// ❌ BAD - Missing colorProfile dependency
const handler = useCallback(() => {
  if (!colorProfile) return;  // Uses colorProfile
  processData(colorProfile);
}, []);  // Missing dependency!

// ✅ GOOD - Complete dependencies
const handler = useCallback(() => {
  if (!colorProfile) return;
  processData(colorProfile);
}, [colorProfile]);  // Includes all used variables
```

### useMemo for Object Stability

**Problem:** Objects recreated on every render cause useCallback to recreate.

```typescript
// ❌ BAD - Object recreated every render
const data = {  // New object identity each render
  id,
  name,
  items
};

const handler = useCallback(() => {
  process(data);
}, [data]);  // Callback recreates on EVERY render

// ✅ GOOD - Memoized object with stable identity
const data = useMemo(() => ({
  id,
  name,
  items
}), [id, name, items]);  // Only recreates when deps change

const handler = useCallback(() => {
  process(data);
}, [data]);  // Callback only recreates when data changes
```

---

## Common Patterns

### Mock localStorage

```typescript
let localStorageData: Record<string, string>;

beforeEach(() => {
  localStorageData = {};

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => localStorageData[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageData[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageData[key];
      }),
      clear: jest.fn(() => {
        localStorageData = {};
      }),
    },
    writable: true,
  });
});
```

### Mock API Responses

```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
) as jest.Mock;
```

### Test Async Functions

```typescript
it('should fetch data', async () => {
  const promise = fetchData('test-id');

  await expect(promise).resolves.toEqual({ id: 'test-id' });
});

it('should handle errors', async () => {
  const promise = fetchData('invalid');

  await expect(promise).rejects.toThrow('Not found');
});
```

---

## Debugging Tests

### Run Single Test

```bash
# By file
npm test cache.test.ts

# By name pattern
npm test -t "should fetch data"

# Watch mode for file
npm run test:watch cache.test.ts
```

### Debug Output

```typescript
it('should process data', () => {
  const result = processData(input);

  console.log('Input:', input);
  console.log('Result:', result);

  expect(result).toBeDefined();
});
```

### Common Issues

**Issue:** Test passes locally but fails in CI
- **Fix:** Check for timing issues, use `await` for async operations

**Issue:** "Cannot read property of undefined"
- **Fix:** Check mock structure matches implementation (e.g., CachedItem wrapper)

**Issue:** Tests depend on each other
- **Fix:** Ensure proper cleanup in `afterEach`, avoid shared state

**Issue:** ESLint hooks warnings
- **Fix:** Add all used variables to dependency arrays, use useMemo for objects

---

## Test Coverage

### Generate Report

```bash
npm run test:coverage
```

### View HTML Report

```bash
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Configured in `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80
  }
}
```

---

## CI/CD Integration

### Pre-commit Validation

```bash
npm run validate
```

Runs:
1. TypeScript type checking
2. ESLint
3. All tests

**Must pass** before committing.

### GitHub Actions

Runs on every push:
- Install dependencies
- Run validation
- Generate coverage report
- Upload coverage to Codecov (if configured)

---

## Best Practices

### DO ✅

- Write tests BEFORE implementation (TDD)
- Test behavior, not implementation details
- Use descriptive test names
- Mock external dependencies (APIs, localStorage)
- Clean up after tests (afterEach)
- Keep tests independent
- Test edge cases and error conditions
- Maintain 80%+ coverage

### DON'T ❌

- Test internal implementation details
- Share state between tests
- Mock everything (prefer integration tests)
- Skip failing tests
- Ignore ESLint warnings
- Write tests after implementation
- Commit without running `npm run validate`

---

## Resources

- **Test Reports:** `.reports/` directory
- **Coverage Report:** `coverage/lcov-report/index.html`
- **Jest Docs:** https://jestjs.io/
- **Testing Library:** https://testing-library.com/
- **Contributing Guide:** `docs/CONTRIB.md`

---

## Recent Fixes (2026-01-31)

✅ Fixed 14 failing cache tests (LocalStorageCache mock structure)
✅ Fixed 2 ESLint React Hooks warnings
✅ All 307 tests now passing
✅ Zero ESLint warnings

See [CHANGELOG.md](../CHANGELOG.md) for details.
