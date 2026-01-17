.PHONY: help install dev build start test clean validate

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

start: ## Start production server
	npm run start

test: ## Run tests
	npm run test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage
	npm run test:coverage

lint: ## Run linter
	npm run lint

type-check: ## Run TypeScript type checking
	npm run type-check

validate: ## Run all validations (type-check, lint, test)
	npm run validate

clean: ## Clean build artifacts
	npm run clean

clean-all: ## Clean everything including node_modules
	npm run clean:all

reset: clean-all install ## Reset project (clean all and reinstall)
