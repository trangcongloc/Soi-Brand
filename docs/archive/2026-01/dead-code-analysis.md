# Dead Code Analysis Report

Generated: 2026-01-21

---

## Cleanup Summary

### Deleted Files
| File | Reason |
|------|--------|
| `components/report/index.ts` | Unused barrel file - imports go directly to individual components |

### Removed Exports
| File | Export | Type |
|------|--------|------|
| `lib/animations.ts` | `layoutSpring` | const |
| `lib/animations.ts` | `listItemVariants` | const |
| `lib/animations.ts` | `chartTransition` | const |
| `lib/animations.ts` | `pulseVariants` | const |
| `lib/animations.ts` | `buttonVariants` | const |
| `lib/animations.ts` | `heatmapCellVariants` | const |
| `lib/animations.ts` | `shouldReduceMotion` | function (kept as internal) |
| `lib/animations.ts` | `getTransition` | function |
| `lib/animations.ts` | `getStaggerDelay` | function |
| `lib/lang/index.ts` | `detectBrowserLanguage` | function |
| `lib/lang/index.ts` | `LANGUAGE_STORAGE_KEY` | const (kept as internal) |
| `lib/cache.ts` | `clearOldReports` | function (kept as internal) |
| `lib/userSettings.ts` | `saveUserSettings` | function (deprecated sync version) |
| `components/report/report-utils.ts` | `getVideoTypeBadge` | function |

### Removed Imports
| File | Import |
|------|--------|
| `components/report/report-utils.ts` | `styles` from ReportDisplay.module.css |

### Verification
- All tests pass (74/74)
- TypeScript type-check passes
- ESLint passes

---

## Summary

| Category | Count |
|----------|-------|
| Unused Files | 1 |
| Unused Exports | 22 |
| Unused Dependencies | 0 |
| Unused Dev Dependencies | 6 |
| Unused Types | 12 |

---

## DANGER - Do Not Delete Without Careful Review

These are config files, main entry points, or critical infrastructure.

| File | Item | Reason |
|------|------|--------|
| `components/ErrorBoundary.tsx` | `ErrorBoundary` | Error boundary component - may be used dynamically |

---

## CAUTION - Review Before Deletion

These are components, API routes, or utilities that may have indirect usage.

### Unused Exports in `lib/animations.ts`

| Export | Line | Notes |
|--------|------|-------|
| `PRIMARY_EASING` | 12 | Animation constant |
| `layoutSpring` | 44 | Animation spring config |
| `listItemVariants` | 52 | Animation variants |
| `chartTransition` | 68 | Chart animation config |
| `pulseVariants` | 84 | Pulse animation |
| `buttonVariants` | 100 | Button animation |
| `heatmapCellVariants` | 110 | Heatmap animation |
| `shouldReduceMotion` | 131 | Accessibility helper |
| `getTransition` | 141 | Transition helper |
| `getStaggerDelay` | 156 | Stagger delay helper |

### Unused Exports in `lib/lang/index.ts`

| Export | Line | Notes |
|--------|------|-------|
| `languages` | 16 | Language list |
| `defaultLanguage` | 17 | Default language config |
| `detectBrowserLanguage` | 48 | Browser detection utility |
| `LANGUAGE_STORAGE_KEY` | 60 | Storage key constant |

### Unused Exports in Other Files

| File | Export | Line |
|------|--------|------|
| `lib/userSettings.ts` | `saveUserSettings` | 170 |
| `lib/cache.ts` | `clearOldReports` | 222 |
| `lib/config.ts` | `getAllowedOrigins` | 40 |
| `lib/errorMappings.ts` | `NETWORK_ERROR_CODES` | 130 |
| `lib/schemas.ts` | `ReportPart2Schema` | 48 |
| `lib/schemas.ts` | `ReportPart3Schema` | 68 |
| `components/report/report-utils.ts` | `getVideoTypeBadge` | 48 |

---

## SAFE - Can Be Deleted

These are test utilities or clearly unused items.

### Unused File

| File | Reason |
|------|--------|
| `components/report/index.ts` | Barrel file - re-exports that may not be used |

### Unused Dev Dependencies

| Package | Notes |
|---------|-------|
| `@testing-library/react` | May be needed for tests - verify test files first |
| `@types/jest` | Jest types - verify if tests use Jest |
| `@types/node` | Node types - likely still needed |
| `@types/react-dom` | React DOM types - likely still needed |
| `jest-environment-jsdom` | Jest DOM env - verify test setup |
| `ts-jest` | TypeScript Jest - verify test setup |

---

## Unused Types (in `lib/types.ts`)

These types are exported but not imported elsewhere. They may be used for documentation or future features.

| Type | Line |
|------|------|
| `AdCreative` | 128 |
| `BrandIdentity` | 147 |
| `ContentStructureAnalysis` | 153 |
| `ContentFocus` | 160 |
| `AudienceDemographics` | 178 |
| `AudienceBehavior` | 195 |
| `VideoIdea` | 222 |
| `KeywordStrategy` | 270 |
| `TagAnalysis` | 276 |
| `OptimizationOpportunity` | 297 |
| `ActionPlanTask` | 316 |
| `ErrorType` (in errorMappings.ts) | 4 |

---

## Recommendations

### Immediate Actions (SAFE)

1. **Verify test setup** - Before removing test dependencies, run `npm run test` to confirm tests work
2. **Review `components/report/index.ts`** - If barrel exports aren't used, consider removing

### Deferred Actions (CAUTION)

1. **Animation utilities** - Many animation exports appear unused. Verify they're not used dynamically before removing
2. **Language utilities** - Some language exports may be used in client components
3. **Type definitions** - Keep types that document the API response structure even if not directly imported

### Do Not Remove (DANGER)

1. **ErrorBoundary** - Critical for error handling, may be used in layout
2. **Config exports** - May be used at runtime
3. **Schema exports** - May be used for validation

---

## Next Steps

1. Run `npm run test` to verify test suite works
2. Review each CAUTION item for indirect usage
3. Delete SAFE items one at a time with test verification
