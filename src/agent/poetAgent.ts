import type { LlmService } from '../services/llmService.js';
import { Poem } from '../models/poem.js';

/**
 * The PoetAgent orchestrates the entire process of creating a poem.
 */
export class PoetAgent {
  // The agent depends on the LlmService abstraction, not a concrete implementation.
  constructor(private llmService: LlmService) {}

  /**
   * Runs the iterative poem generation process.
   * @param title - An optional title to start with.
   * @param seedLine - An optional first line to start with.
   * @returns The completed Poem object.
   */
  public async run(title?: string, seedLine?: string): Promise<Poem> {
    console.log('✨ Starting poem generation...');

    const finalTitle = title ?? await this.generateTitle();
    const firstLine = seedLine ?? await this.generateSeedLine();
    
    const poem = new Poem(finalTitle, [firstLine]);
    console.log(`\nTitle: ${poem.title}`);
    console.log('--------------------');
    console.log(poem.lines[0]);

    let isComplete = false;
    const maxLines = 12; // Safety break to prevent infinite loops.

    while (!isComplete && poem.lines.length < maxLines) {
      const nextLine = await this.generateNextLine(poem);
      poem.addLine(nextLine);
      console.log(nextLine);
      
      // Only check for completion after a minimum number of lines have been generated.
      if (poem.lines.length >= 4) {
        isComplete = await this.checkIfComplete(poem);
      }
    }

    console.log('--------------------');
    console.log('✒️ Poem finished.\n');
    return poem;
  }

  private async generateTitle(): Promise<string> {
    const prompt = 'Generate a short, evocative title for a new poem. The title should be two to five words. Respond with only the title itself, without any extra text or quotation marks.';
    const title = await this.llmService.generate(prompt);
    return title.trim().replace(/"/g, ''); // Clean up quotes just in case.
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

  private async generateNextLine(poem: Poem): Promise<string> {
    const prompt = `
      You are a poet creating a new poem. Here is the poem so far:
      ---
      Title: ${poem.title}
      ${poem.lines.join('\n')}
      ---
      Your task is to add the next single line to continue the poem.
      The line should be creative and fit the existing theme and rhythm.
      The poem should have a clear narrative arc. It starts in one place, moves through a journey, and ends somewhere different.
      Consider using rhyme, internal rhyme, or no rhyme at all.
      Respond with only the single new line, without any extra text or quotation marks.
    `;
    const nextLine = await this.llmService.generate(prompt);
    return nextLine.trim();
  }

  private async checkIfComplete(poem: Poem): Promise<boolean> {
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