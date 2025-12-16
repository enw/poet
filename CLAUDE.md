# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**my-poet** is an iterative CLI application that generates poems line-by-line using a local LLM (Ollama). The LLM creates poems with emergent structure—starting with a title and seed line, then iteratively adding lines until completion criteria are met.

## Commands

### Development
- `pnpm build` - Compile TypeScript to JavaScript (outputs to `dist/`)
- `pnpm start` - Run the compiled CLI application
- `pnpm dev` - Build and run in one command
- `pnpm run link` - Build, make executable, and link to `~/.local/bin/poet` for global CLI access
- `pnpm test` - Run Jest test suite (configured with ts-jest)

### CLI Usage
- `poet create` - Generate a new poem (default command). Options:
  - `-m, --model <name>` - Specify Ollama model (auto-selects if omitted)
  - `-t, --title <title>` - Seed poem with a specific title
  - `-s, --seed-line <line>` - Seed poem with a specific starting line
- `poet list-models` - List all available Ollama models

## Architecture

### Core Design Pattern: Service Abstraction
The application uses dependency injection with an `LlmService` interface. This allows swapping implementations (currently only Ollama) without changing agent logic.

**Key files:**
- [src/services/llmService.ts](src/services/llmService.ts) - Interface defining LLM contract (`generate()`, `listModels()`)
- [src/services/ollamaService.ts](src/services/ollamaService.ts) - Ollama implementation

### Main Components

**PoetAgent** ([src/agent/poetAgent.ts](src/agent/poetAgent.ts))
- Orchestrates poem generation through iterative LLM calls
- Flow: generate title → generate seed line → loop: generate next line → check completion
- Completion logic: checks if poem has minimum 4 lines and LLM declares "complete"
- Safety: max 12 lines prevents infinite loops
- Each LLM call is independent; agent rebuilds context in prompts

**Poem Model** ([src/models/poem.ts](src/models/poem.ts))
- Simple data class holding title and lines array
- No business logic beyond `addLine()` and `toString()`

**OllamaService** ([src/services/ollamaService.ts](src/services/ollamaService.ts))
- Wraps Ollama Node.js client
- `findBestAvailableModel()` - Static method that tries to auto-select best model:
  1. Prefers models with "instruct" in name
  2. Falls back to 8b models
  3. Defaults to first available model
- Centralized error handling with `handleError()` utility

**CLI** ([src/cli/index.ts](src/cli/index.ts))
- Uses Commander.js for argument parsing
- Sets `create` as default command
- Loads version from package.json using JSON import assertion

### Compilation & Output
- TypeScript target: ES2022, module format: NodeNext
- Outputs to `dist/` directory with source maps
- Shebang (`#!/usr/bin/env node`) in entry point [src/index.ts](src/index.ts) makes binary executable
- Binary registered in package.json as `poet` command

## Dependencies
- **commander** - CLI argument parsing
- **ollama** - Node.js client for local Ollama API
- **jest + ts-jest** - Testing with TypeScript support

## Testing
Tests use Jest with TypeScript support (ts-jest preprocessor). Run single test with:
```bash
pnpm test -- --testNamePattern="<test name>"
```

## Important Notes
- Ollama must be running locally (defaults to http://localhost:11434)
- All LLM prompts are hand-crafted with specific formatting (e.g., "respond with only...")
- No state persistence; each poem generation is ephemeral
- Error messages use emojis for terminal visibility
