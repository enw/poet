# GEMINI.md - Iterative Poet Agent

This document provides guidance for the development of an AI agent that iteratively creates poetry.

## 1. Product Requirements Document (PRD): The Iterative Poet

### 1.1. Overview

The Iterative Poet is an AI agent designed to autonomously generate unique poems. The agent begins with a seed concept (a title and a famous quote) and then builds upon it line by line, employing a variety of poetic styles and structures. The goal is to create a process that mimics a creative arc, resulting in a finished poem that is cohesive and evocative.

### 1.2. Core Objective

To create an agent that can generate a complete, original poem through an iterative, line-by-line process, demonstrating a flexible understanding of poetic form, style, and narrative flow.

### 1.3. Agent Behavior & Features

#### 1.3.1. Initialization (Seeding the Poem)

1.  **Title Generation:** The agent will first generate a suitable title for the poem.
2.  **Seed Line:** The agent will select a single, well-known line from a diverse range of public figures (e.g., poets, scientists, politicians, artists, celebrities). This line will serve as the first line of the poem.

#### 1.3.2. Iterative Generation Process

1.  **One Line at a Time:** The core logic of the agent is a loop. In each iteration, the agent reads the entire poem in its current state (title + all existing lines).
2.  **Add a Single Line:** Based on the current state, the agent adds exactly one new line to the poem.
3.  **State Management:** The new line is appended to the poem, and this updated version becomes the input for the next iteration.

#### 1.3.3. Poetic Style & Constraints

The agent's generation process should be varied and not confined to a single style. It should demonstrate flexibility by incorporating the following elements, sometimes in combination:

*   **Rhyme Scheme:**
    *   **End Rhymes:** Lines should occasionally rhyme with the line immediately preceding or following them.
    *   **Internal Rhymes:** Some lines should contain words that rhyme within the same line.
    *   **Free Verse:** Many lines should not rhyme at all, focusing instead on rhythm, imagery, or meaning.
*   **Formatting & Style:**
    *   The agent should be able to produce poems in different formats, such as traditional stanzas, haikus, or free-form verse.
    *   It may choose a specific stylistic constraint, like writing entirely in lower-case.
    *   It may experiment with unconventional forms, such as using pure sounds or onomatopoeia.
*   **Genre Influence:** The output could resemble various genres, from lyrical verses to hip-hop rhythms.

#### 1.3.4. Poem Structure & Completion

1.  **Narrative Arc:** The poem must have a discernible flow. It should start at one point, move through a thematic or emotional arc, and arrive at a conclusion. It should not be a random collection of lines.
2.  **Completion Criteria:** The agent must have a mechanism to decide when a poem is "finished." This could be based on:
    *   Reaching a natural thematic conclusion.
    *   Fulfilling a specific poetic structure (e.g., completing a sonnet or a series of haikus).
    *   A built-in sense of poetic completeness, where adding more lines would detract from the work.

### 1.4. Technical Implementation Sketch

*   **Core Engine:** The agent will use a local Large Language Model (LLM) hosted via Ollama.
*   **Model Selection:**
    *   **First Run:** On its first execution, the agent should query the Ollama API (`/api/tags`) to get a list of available models. It should then use a default heuristic to select the "best" model (e.g., prefer a model with "instruct" in the name, or a larger model if size can be determined).
    *   **Subsequent Runs:** The chosen model should be saved in a local configuration file for subsequent runs.
*   **Agent Loop:**
    1.  **`initialize_poem()`:**
        *   Prompt the LLM to generate a title.
        *   Prompt the LLM to select a famous quote to serve as the first line.
    2.  **`iterate_poem(current_poem)`:**
        *   Construct a prompt that includes the `current_poem` and a set of instructions.
        *   The instructions should guide the LLM to: "Read the following poem. Add only one new line that continues the theme and flow. Consider using rhyme (or not). The poem should build towards a conclusion."
    3.  **`is_complete(current_poem)`:**
        *   After each iteration, a separate prompt could ask the LLM: "Is this poem complete? Does it have a clear beginning, middle, and end? Answer only 'yes' or 'no'."
        *   The loop continues until the agent determines the poem is complete.
*   **State:** The primary state managed by the agent will be a data structure containing the poem's title and an ordered list of its lines.

### 1.5. Command-Line Interface (CLI)

The agent should be runnable from the command line and support the following options:

*   `--model <model_name>`: Explicitly specify which Ollama model to use (e.g., `llama3:8b-instruct`). This overrides any saved configuration or default selection.
*   `--list-models`: List all available models from the local Ollama instance and exit.
*   `--title "<poem_title>"`: Seed the poem with a specific title.
*   `--seed-line "<famous_line>"`: Seed the poem with a specific starting line.
