# 🖋️ my-poet

An iterative CLI poet that generates poems **line by line** using a local LLM. Watch as an AI creates original poetry in real-time, with themes, styles, and emergent structure.

## Features

- 🤖 **Local LLM Generation** - Uses Ollama for private, on-device poetry creation
- 🎨 **Themable & Styleable** - Guide poems with custom themes (Nature, Love, Tech, etc.) and poetic styles (Haiku, Sonnet, Free Verse, etc.)
- 🎯 **Interactive Mode** - TUI-like prompts to customize every aspect of poem generation
- ⚡ **Smart Completion** - Detects when poems feel finished based on narrative arc and structure
- 💾 **Config Persistence** - Save your favorite settings to `.poet` files for quick reuse
- 📝 **Multiple Styles** - Built-in support for Haiku (3 lines), Sonnet (14 lines), Free Verse, and more

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Ollama** running locally ([install here](https://ollama.ai))
- At least one Ollama model (e.g., `ollama pull mistral`)

### Installation

```bash
npm install -g my-poet
# or
pnpm add -g my-poet
```

### Generate Your First Poem

```bash
poet create
```

The CLI will auto-detect your best available Ollama model and generate an interactive poem.

## Usage

### Default: Interactive Mode

```bash
poet create --interactive
```

You'll be prompted to:
1. Select an LLM model
2. Optionally provide a title
3. Optionally provide a seed line
4. Choose a theme (Nature, Love, Technology, etc.)
5. Choose a poetic style (Free Verse, Haiku, Sonnet, etc.)

### Command Flags

Generate a poem with specific parameters:

```bash
poet create \
  --model mistral \
  --title "Moonlight" \
  --seed-line "The night falls silent" \
  --theme "Dreams" \
  --style "Free Verse"
```

**Available options:**
- `-m, --model <name>` - Specify Ollama model
- `-t, --title <title>` - Custom poem title
- `-s, --seed-line <line>` - Starting line (overrides seed generation)
- `--theme <theme>` - Guide the poem's topic
- `--style <style>` - Poetry format (Haiku, Sonnet, Free Verse, etc.)
- `-i, --interactive` - Interactive setup mode

### List Available Models

```bash
poet list-models
```

Shows all Ollama models installed locally.

### Save Configuration

```bash
poet save-config \
  --model mistral \
  --theme "Urban Life" \
  --style "Hip-Hop"
```

Saves these defaults to `~/.poet` for future use. Future poem generations will use these saved settings.

## How It Works

### Architecture

The app uses a **service-based architecture** for flexibility:

```
CLI (Commander.js)
  ↓
PoetAgent (orchestrates poem generation)
  ↓
LlmService (interface)
  ↓
OllamaService (concrete implementation)
  ↓
Ollama API (local LLM)
```

### Generation Flow

1. **Title Generation** - Creates an evocative title (optionally themed)
2. **Seed Line** - Generates a famous quote or provided seed
3. **Iterative Expansion** - Loops to generate next lines:
   - Rebuilds context with all previous lines
   - Maintains theme and style constraints
   - Checks completion criteria
4. **Completion** - Stops when:
   - Poem reaches max lines (12 default, 3 for Haiku, 14 for Sonnet)
   - LLM declares the poem "complete" based on narrative arc

### Key Files

| File | Purpose |
|------|---------|
| `src/agent/poetAgent.ts` | Main poem generation orchestrator |
| `src/services/ollamaService.ts` | Ollama API wrapper |
| `src/models/poem.ts` | Poem data structure |
| `src/cli/index.ts` | Command-line interface |
| `src/services/configService.ts` | Loads/saves `.poet` config files |

## Development

### Build

```bash
pnpm build
```

Compiles TypeScript to `dist/` (ES2022, source maps included).

### Run Locally

```bash
pnpm dev
```

Builds and runs the CLI in one command.

### Link to Local PATH

```bash
pnpm run link
```

Makes `poet` available globally as a shell command.

### Testing

```bash
pnpm test
```

Runs Jest test suite (configured with ts-jest).

### Single Test

```bash
pnpm test -- --testNamePattern="<test name>"
```

## Configuration

The `.poet` config file is stored at:
- **Linux/Mac**: `~/.poet`
- **Windows**: `%USERPROFILE%\.poet`

Example config:

```json
{
  "model": "mistral",
  "theme": "Nature",
  "style": "Free Verse",
  "title": "Morning Light",
  "seedLine": "The sun rises slowly"
}
```

All CLI flags override config file settings.

## Examples

### Generate a Haiku

```bash
poet create --style "Haiku" --theme "Seasons"
```

**Output:**
```
Title: Winter's Silence
--------------------
Snowflakes gently fall
White blanket covers the earth
Quiet beauty rests
--------------------
✒️ Poem finished.
```

### Generate a Sonnet

```bash
poet create --style "Sonnet" --theme "Love" --model neural-chat
```

### Generate with Custom Seed

```bash
poet create \
  --title "Echoes" \
  --seed-line "In the beginning was the word" \
  --theme "Philosophy"
```

### Use Saved Config

```bash
poet save-config --model neural-chat --theme "Urban Life" --style "Hip-Hop"
poet create  # Uses saved settings automatically
```

## Requirements

- **Ollama** must be running (defaults to `http://localhost:11434`)
- At least one model installed (run `ollama pull mistral` to start)
- Node 18+

## Troubleshooting

**"No models found" error**
```bash
ollama pull mistral
```

**Ollama not running**
```bash
# Start Ollama (macOS)
open /Applications/Ollama.app

# Start Ollama (Linux)
ollama serve
```

**Model taking too long**
- Try a smaller model: `ollama pull phi` or `ollama pull neural-chat`
- Check your system resources

## Tech Stack

- **CLI Framework**: Commander.js
- **LLM Client**: Ollama Node.js SDK
- **Language**: TypeScript (ES2022)
- **Testing**: Jest + ts-jest
- **Package Manager**: pnpm

## License

ISC

## Contributing

Contributions welcome! The codebase is structured for easy extension:
- Add new `LlmService` implementations for other APIs
- Extend `PoetAgent` with new generation strategies
- Add more built-in themes, styles, or completion rules

---

Made with ✒️ and 🤖
