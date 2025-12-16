# 🚀 my-poet — Real‑Time Local AI Poetry Engine

**my-poet turns your terminal into a tiny, local-first poetry studio.** It orchestrates a local LLM (via Ollama) to **compose poems line by line in real time**, with structure, style, and voice that bend around *you*.

No cloud, no tracking, no mysterious black box product team—just **raw, iterative AI text generation** you can see, shape, and hack.

- **Not another chat UI**: it’s a *poem generator pipeline* you own end-to-end.
- **Not “AI magic” marketing**: it’s TypeScript + Ollama + a focused agent loop.
- **Feels bigger than a toy**, but honest enough to admit it’s a tiny, weird poetry machine.

---

## ✨ What It Actually Does

An iterative CLI poet that generates poems **line by line** using a local LLM. Watch as an AI creates original poetry in real time, with themes, styles, and emergent structure.

### Core Capabilities

- 🤖 **Local-Only LLM Generation**  
  Uses **Ollama** for private, on-device poetry creation. Your text never leaves your machine.
- 🎨 **Themable & Styleable**  
  Guide poems with custom **themes** (Nature, Love, Tech, etc.) and **poetic styles** (Haiku, Sonnet, Free Verse, etc.).
- 🕹️ **Interactive Creation Flow**  
  TUI-like prompts to customize each poem before generation.
- ⚡ **Structure-Aware Completion**  
  The agent stops when the poem “feels done” based on line count, form rules, and completion signals from the LLM.
- 💾 **Config Persistence**  
  Save your favorite settings to a `.poet` file and reuse them instantly.
- 👤 **Bio-Aware Personalization**  
  Drop a `~/.me.toon` bio file and the system steers generations toward your voice and perspective.
- 📝 **Multiple Poetic Forms**  
  Built‑in support for Haiku, Limerick, Sonnet, Free Verse, and more, with structure-aware prompts.

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+
- **Ollama** running locally ([install here](https://ollama.ai))
- At least one Ollama model (for example):

```bash
ollama pull mistral
```

### Install the CLI

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

---

## 🧑‍💻 Usage

### Default: Interactive Mode

```bash
poet create --interactive
```

You’ll be guided through:

1. Selecting an LLM model
2. Optionally providing a title
3. Optionally providing a seed line
4. Choosing a theme (Nature, Love, Technology, etc.)
5. Choosing a poetic style (Free Verse, Haiku, Sonnet, etc.)

### Command Flags

Generate a poem with explicit parameters:

```bash
poet create \
  --model mistral \
  --title "Moonlight" \
  --seed-line "The night falls silent" \
  --theme "Dreams" \
  --style "Free Verse"
```

**Available options:**

- `-m, --model <name>` – Specify Ollama model
- `-t, --title <title>` – Custom poem title
- `-s, --seed-line <line>` – Starting line (overrides seed generation)
- `--theme <theme>` – Guide the poem’s topic
- `--style <style>` – Poetry format (Haiku, Sonnet, Free Verse, etc.)
- `-i, --interactive` – Interactive setup mode

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

Saves these defaults to `~/.poet` for future use. Future poem generations will use these saved settings unless you override them with flags.

### Personalize with Your Bio

Create a `~/.me.toon` file to personalize poems with your unique perspective:

```bash
echo "A software engineer obsessed with poetry and moonlit walks" > ~/.me.toon
```

The CLI will automatically load this file and incorporate your bio into:

- **Title Generation** – Titles that reflect who you are
- **Seed Line Selection** – Quotes that resonate with your perspective
- **Poem Generation** – Lines written from your point of view

**Example `~/.me.toon` content:**

```text
A jazz musician from New Orleans, passionate about improvisation and storytelling
```

When you run:

```bash
poet create --theme "Music"
```

…the generated poem will lean into a jazz musician’s voice and perspective. All poems generated will naturally tend toward your unique voice and experience.

---

## 🧬 How It Works Under the Hood

### High-Level Architecture

my-poet uses a **service-based architecture** so you can swap out pieces without rewriting everything:

```text
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

1. **Title Generation**  
   Creates an evocative title (optionally themed and personalized via bio).
2. **Seed Line**  
   Generates a quote/seed line or uses your provided one, tuned to your perspective if a bio exists.
3. **Iterative Expansion**  
   Loops to generate subsequent lines:
   - Rebuilds context with all previous lines
   - Maintains theme and style constraints
   - Applies structural hints (rhyme scheme, syllable expectations, rhythm cues)
   - Incorporates the user’s voice and perspective
   - Checks completion signals from the LLM
4. **Completion Logic**  
   Stops when one of the following holds:
   - Haiku reaches 3 lines (5–7–5 syllable pattern is encouraged via prompts)
   - Limerick reaches 5 lines (AABBA structure guidance)
   - Sonnet reaches 14 lines (ABAB CDCD EFEF GG pattern guidance)
   - Default max of 12 lines for free verse
   - LLM indicates that the poem is complete based on narrative arc

### Key Files

| File                        | Purpose                                   |
|-----------------------------|-------------------------------------------|
| `src/agent/poetAgent.ts`    | Main poem generation orchestrator         |
| `src/services/ollamaService.ts` | Ollama API wrapper                    |
| `src/services/bioService.ts`    | Loads user bio from `~/.me.toon`     |
| `src/models/poem.ts`        | Poem data structure                       |
| `src/cli/index.ts`          | Command-line interface                    |
| `src/services/configService.ts` | Loads/saves `.poet` config files    |

---

## 🛠️ Development

### Build

```bash
pnpm build
```

Compiles TypeScript to `dist/` (ES2022 target, with source maps).

### Run Locally (Dev Loop)

```bash
pnpm dev
```

Builds and runs the CLI in one command.

### Link to Your PATH

```bash
pnpm run link
```

Makes `poet` available globally as a shell command.

### Testing

```bash
pnpm test
```

Runs the Jest test suite (configured with ts-jest).

#### Run a Single Test

```bash
pnpm test -- --testNamePattern="<test name>"
```

---

## ⚙️ Configuration

### Settings: `.poet` File

The `.poet` config file stores your default poem generation settings.

**Location:**

- **Linux/Mac**: `~/.poet`
- **Windows**: `%USERPROFILE%\.poet`

**Example:**

```json
{
  "model": "mistral",
  "theme": "Nature",
  "style": "Free Verse",
  "title": "Morning Light",
  "seedLine": "The sun rises slowly"
}
```

CLI flags always override config file settings.

### Bio: `.me.toon` File

The `.me.toon` file contains your biographical information, used to personalize generated poems.

**Location:**

- **Linux/Mac**: `~/.me.toon`
- **Windows**: `%USERPROFILE%\.me.toon`

**Example:**

```text
A poet living in Portland, deeply inspired by rain and small moments of wonder
```

Keep it concise (1–2 sentences) for best results. This is loaded automatically and used in poem generation prompts.

---

## 🎛️ Examples

### Generate a Haiku

```bash
poet create --style "Haiku" --theme "Seasons"
```

**Example Output:**

```text
Title: Winter's Silence
--------------------
Snowflakes gently fall
White blanket covers the earth
Quiet beauty rests
--------------------
✒️ Poem finished.
```

### Generate a Limerick

```bash
poet create --style "Limerick" --theme "Humor"
```

**Example Output:**

```text
Title: A Curious Tale
--------------------
There once was a coder named Fred
Who wrote all his code while in bed
With a keyboard in hand
The results were quite grand
And the bugs were all brilliantly spread
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

### Generate with Personalized Bio

```bash
echo "A curious engineer obsessed with the stars and dark matter" > ~/.me.toon
poet create --theme "Science"
# The generated poem will reflect your perspective as an engineer fascinated by physics
```

---

## ✅ Requirements

- **Ollama** must be running (defaults to `http://localhost:11434`)
- At least one model installed (for example: `ollama pull mistral`)
- Node 18+

---

## 🩺 Troubleshooting

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

---

## 🧱 Tech Stack

- **CLI Framework**: Commander.js
- **LLM Client**: Ollama Node.js SDK
- **Language**: TypeScript (ES2022)
- **Testing**: Jest + ts-jest
- **Package Manager**: pnpm

---

## 🤝 Contributing

Contributions are welcome. The codebase is intentionally small and modular so you can:

- Add new `LlmService` implementations for other APIs
- Extend `PoetAgent` with new generation strategies
- Add more built-in themes, styles, or completion rules

---

## 📄 License

ISC

---

Made with ✒️, TypeScript, and an unreasonable amount of curiosity about what happens when you give an LLM a metronome instead of a chat box.
