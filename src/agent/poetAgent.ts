import type { LlmService } from '../services/llmService.js';
import { Poem } from '../models/poem.js';

interface RunOptions {
  title?: string;
  seedLine?: string;
  theme?: string;
  style?: string;
}

/**
 * The PoetAgent orchestrates the entire process of creating a poem.
 */
export class PoetAgent {
  // The agent depends on the LlmService abstraction, not a concrete implementation.
  constructor(private llmService: LlmService) {}

  /**
   * Runs the iterative poem generation process.
   * @param options - Configuration for the run.
   * @returns The completed Poem object.
   */
  public async run(options: RunOptions = {}): Promise<Poem> {
    const { title, seedLine, theme, style } = options;
    console.log('✨ Starting poem generation...');

    const finalTitle = title || await this.generateTitle(theme);
    const firstLine = seedLine || await this.generateSeedLine();
    
    const poem = new Poem(finalTitle, [firstLine]);
    console.log(`\nTitle: ${poem.title}`);
    console.log('--------------------');
    console.log(poem.lines[0]);

    let isComplete = false;
    const maxLines = style === 'haiku' ? 3 : 12; // Haikus are short.

    while (!isComplete && poem.lines.length < maxLines) {
      const nextLine = await this.generateNextLine(poem, theme, style);
      poem.addLine(nextLine);
      console.log(nextLine);
      
      // Only check for completion after a minimum number of lines have been generated.
      if (poem.lines.length >= 3) {
        isComplete = await this.checkIfComplete(poem, style);
      }
    }

    console.log('--------------------');
    console.log('✒️ Poem finished.\n');
    return poem;
  }

  private async generateTitle(theme?: string): Promise<string> {
    let prompt = 'Generate a short, evocative title for a new poem. The title should be two to five words.';
    if (theme) {
      prompt += ` The theme of the poem is "${theme}".`;
    }
    prompt += ' Respond with only the title itself, without any extra text or quotation marks.';
    
    const title = await this.llmService.generate(prompt);
    return title.trim().replace(/"/g, '');
  }

  private async generateSeedLine(): Promise<string> {
    const prompt = `
      Provide a single, famous, and thought-provoking quote from a well-known public figure 
      (e.g., a poet, scientist, politician, artist, or a line from a movie). 
      Respond with only the quote itself, without any extra text or quotation marks.
    `;
    const line = await this.llmService.generate(prompt);
    return line.trim();
  }

  private async generateNextLine(poem: Poem, theme?: string, style?: string): Promise<string> {
    let prompt = `
      You are a poet creating a new poem. Here is the poem so far:
      ---
      Title: ${poem.title}
      ${poem.lines.join('\n')}
      ---
      Your task is to add the next single line to continue the poem.
      The line should be creative and fit the existing theme and rhythm.
      The poem should have a clear narrative arc.
    `;

    if (theme) {
      prompt += `\nThe poem's theme must be: ${theme}.`;
    }
    if (style) {
      prompt += `\nThe poem must be in the style of a ${style}. Adhere strictly to its structure.`;
      if (style.toLowerCase() === 'haiku' && poem.lines.length === 1) {
        prompt += ' This next line should have 7 syllables.';
      }
      if (style.toLowerCase() === 'haiku' && poem.lines.length === 2) {
        prompt += ' This next line should have 5 syllables and conclude the haiku.';
      }
    }

    prompt += '\nRespond with only the single new line, without any extra text or quotation marks.';
    
    const nextLine = await this.llmService.generate(prompt);
    return nextLine.trim();
  }

  private async checkIfComplete(poem: Poem, style?: string): Promise<boolean> {
    if (style?.toLowerCase() === 'haiku' && poem.lines.length >= 3) {
      return true;
    }
    if (style?.toLowerCase() === 'sonnet' && poem.lines.length >= 14) {
      return true;
    }

    const prompt = `
      Here is a poem:
      ---
      Title: ${poem.title}
      ${poem.lines.join('\n')}
      ---
      Considering its narrative arc and thematic development, does this poem feel complete and finished?
      The poem should not end abruptly. It should feel resolved.
      Answer with only the word "yes" or "no".
    `;
    const response = await this.llmService.generate(prompt);
    return response.trim().toLowerCase().includes('yes');
  }
}