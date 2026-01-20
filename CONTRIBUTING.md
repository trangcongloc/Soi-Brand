# Contributing to Soi'Brand

## Setup

```bash
# Prerequisites: Node.js 24.x (use nvm)
nvm use

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Add your API keys

# Run development server
npm run dev
```

## Commands

```bash
npm run dev           # Development server
npm run build         # Production build
npm run lint          # ESLint
npm run type-check    # TypeScript check
npm run test          # Run tests
npm run test:coverage # Tests with coverage
npm run validate      # All checks
npm run clean         # Clean build artifacts
```

## Code Quality

Before committing:
```bash
npm run validate
```

This runs type checking, linting, and tests.

## Project Structure

```
app/           # Next.js app directory
components/    # React components
lib/           # Utilities and API integrations
__tests__/     # Test files
```

## Pull Request Process

1. Create feature branch from `main`
2. Make changes
3. Run `npm run validate`
4. Commit with descriptive message
5. Create Pull Request

## Commit Messages

Use conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code refactoring
- `test:` tests
- `chore:` maintenance
