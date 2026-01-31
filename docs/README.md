# Documentation

This directory contains technical documentation and guides for the Soi'Brand project.

## Getting Started

- **[CONTRIB.md](./CONTRIB.md)** - Development workflow, setup, and testing procedures
- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide and best practices
- **[RUNBOOK.md](./RUNBOOK.md)** - Operations guide for deployment and monitoring

## Technical Guides

- **[VEO3-PROMPTING-GUIDE.md](./VEO3-PROMPTING-GUIDE.md)** - VEO 3 video generation prompting techniques
- **[TIER_RATE_LIMITING.md](./TIER_RATE_LIMITING.md)** - API rate limiting documentation
- **[AnalyzeTab.md](./AnalyzeTab.md)** - Analysis Tab component and data mapping

## Project Planning

- **[roadmap.md](./roadmap.md)** - Product roadmap with planned features

## Root Documentation

- [`/README.md`](../README.md) - Main project README with setup instructions
- [`/CLAUDE.md`](../CLAUDE.md) - Instructions for Claude Code AI assistant
- [`/CHANGELOG.md`](../CHANGELOG.md) - Version history and recent changes

## Quick Links

**Development:**
```bash
npm run dev          # Start dev server
npm run validate     # Run all checks (type-check + lint + test)
npm run test:watch   # Run tests in watch mode
```

**Testing Status:**
- ✅ 307 tests passing
- ✅ 0 ESLint warnings
- ✅ TypeScript strict mode enabled

**Recent Updates (2026-01-31):**
- Fixed 14 failing cache tests (LocalStorageCache structure)
- Fixed 2 React Hooks ESLint warnings
- Added comprehensive testing guide
- Updated contribution guidelines
