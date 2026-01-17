# Contributing to OurTube

Thank you for your interest in contributing to OurTube! This document provides guidelines and workflows for development.

## Development Workflow

### Prerequisites

- Node.js 24.x (use nvm: `nvm use`)
- npm 10.x or later

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OurTube
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or use make
   make install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   make dev
   ```

### Available Commands

#### Using npm
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run clean` - Clean build artifacts
- `npm run clean:all` - Clean everything including node_modules
- `npm run validate` - Run all validations (type-check + lint + test)

#### Using Make (recommended)
```bash
make help           # Show all available commands
make install        # Install dependencies
make dev            # Start development
make build          # Build for production
make test           # Run tests
make validate       # Run all validations
make clean          # Clean build files
make reset          # Reset project (clean + reinstall)
```

## Code Quality Standards

### Before Committing

Always run validation before committing:
```bash
npm run validate
# or
make validate
```

This will:
1. Check TypeScript types
2. Run ESLint
3. Run all tests

### Code Style

- Use TypeScript for all new files
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing

- Write tests for new features
- Maintain test coverage above 50%
- Run `npm run test:coverage` to check coverage

## Project Structure

```
OurTube/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── types.ts          # TypeScript types
│   ├── youtube.ts        # YouTube API
│   ├── gemini.ts         # Gemini AI
│   └── ...
├── __tests__/            # Test files
└── public/               # Static assets
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `make validate` to ensure code quality
4. Commit with a descriptive message
5. Push to your fork
6. Create a Pull Request

## Commit Message Guidelines

Use conventional commits format:
- `feat: add new feature`
- `fix: fix bug in component`
- `docs: update documentation`
- `style: formatting changes`
- `refactor: code refactoring`
- `test: add tests`
- `chore: update dependencies`

## Need Help?

- Check the [CLAUDE.md](./CLAUDE.md) for project overview
- Review the [README.md](./README.md) for basic information
- Open an issue for bugs or feature requests
