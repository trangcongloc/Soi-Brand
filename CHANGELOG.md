# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed 14 failing cache tests caused by incorrect mock structure in LocalStorageCache tests
- Fixed React Hooks ESLint warning for missing `colorProfile` dependency in `app/veo/page.tsx`
- Fixed React Hooks ESLint warning for unstable `jsonData` object in `components/veo/VeoJsonView.tsx`

### Changed
- Updated test helpers in `__tests__/lib/veo/cache.test.ts` to properly wrap cached data in `CachedItem` structure
- Updated test setup in `__tests__/lib/cache.test.ts` to match LocalStorageCache format
- Wrapped `jsonData` object in `useMemo` to prevent unnecessary re-renders
- Added `colorProfile` to useCallback dependency array to prevent stale closures

### Documentation
- Added LocalStorageCache testing best practices to `docs/CONTRIB.md`
- Added React Hooks testing guidelines to `docs/CONTRIB.md`
- Created comprehensive test fix summary in `.reports/test-fixes-summary.md`

## [0.1.0] - 2026-01-31

### Added
- VEO (Video Scene Generator) integration with Google Gemini
- Grouped card layout for VEO settings panel
- Support for image and video generation modes
- Audio settings (music, SFX, ambient, dialogue)
- Color profile extraction from source videos
- Character extraction and consistency tracking
- Selfie mode for authentic footage
- JSON view for scene data export
- Comprehensive caching system with LocalStorageCache
- Project review reports (refactor-clean, code-review, tdd-coverage)

### Changed
- Reorganized VEO settings into 5 logical groups (Generation, Output, Audio, Analysis, Shot Type)
- Restructured VEO response schema into 10 sections for better readability
- Consolidated demo files into single `demo/veo/structure.md` documentation

### Technical
- Next.js 14 with App Router
- React 18 with TypeScript 5
- Google Gemini API integration
- YouTube Data API v3 integration
- Jest + Testing Library for tests
- LocalStorageCache for client-side caching
- Framer Motion for animations

### Testing
- 307 passing tests across 10 test suites
- 0 ESLint warnings or errors
- TypeScript strict mode enabled
- Full validation pipeline (type-check + lint + test)

---

## Version History

### [Unreleased]
- Test fixes and React Hooks improvements
- Enhanced documentation

### [0.1.0] - 2026-01-31
- Initial release with VEO integration
- Settings UI overhaul
- Comprehensive testing suite
