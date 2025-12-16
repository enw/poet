import type { LlmService } from '../services/llmService.js';
import { Poem } from '../models/poem.js';

interface RunOptions {
  title?: string;
  seedLine?: string;
  theme?: string;
  style?: string;
  userBio?: string; // Added userBio to RunOptions
}

/**
 * The PoetAgent orchestrates the entire process of creating a poem.
 */
export class PoetAgent {
  // The agent depends on the LlmService abstraction, not a concrete implementation.
  private userBio?: string; // Added userBio property

  constructor(private llmService: LlmService) {}

  /**
   * Runs the iterative poem generation process.
   * @param options - Configuration for the run.
   * @returns The completed Poem object.
   */
  public async run(options: RunOptions = {}): Promise<Poem> {
    const { title, seedLine, theme, style, userBio } = options;
    this.userBio = userBio; // Assign userBio to property
    console.log('✨ Starting poem generation...');

    const finalTitle = title || await this.generateTitle(theme);
    const firstLine = seedLine || await this.generateSeedLine();
    
    const poem = new Poem(finalTitle, [firstLine]);
    console.log(`\nTitle: ${poem.title}`);
    console.log('--------------------');
    console.log(poem.lines[0]);

    let isComplete = false;
    let maxLines = 12; // Default max lines
    const lowerCaseStyle = style?.toLowerCase();
    if (lowerCaseStyle && lowerCaseStyle !== 'random') {
      if (lowerCaseStyle === 'haiku') {
        maxLines = 3;
      } else if (lowerCaseStyle === 'limerick') {
        maxLines = 5;
      } else if (lowerCaseStyle === 'sonnet') {
        maxLines = 14;
      }
    }

    while (!isComplete && poem.lines.length < maxLines) {
      const nextLine = await this.generateNextLine(poem, theme, style);
      poem.addLine(nextLine);
      console.log(nextLine);
      
      // Only check for completion after a minimum number of lines have been generated.
      // Or if the poem has reached its style-defined length.
      if (poem.lines.length >= 3 || poem.lines.length === maxLines) {
        isComplete = await this.checkIfComplete(poem, style);
      }
    }

    console.log('--------------------');
    console.log('✒️ Poem finished.\n');
    return poem;
  }

  private async generateTitle(theme?: string): Promise<string> {
    let prompt = 'Generate a short, evocative, and highly original title for a new poem. The title should be two to five words. Be creative and unexpected—avoid clichés and common phrases. Use unusual word combinations, surprising imagery, or abstract concepts. Make it memorable and distinct.';
    if (this.userBio) { // Use userBio in prompt
      prompt += ` The poem is written by someone with the following perspective: ${this.userBio}.`;
    }
    if (theme && theme.toLowerCase() !== 'random') {
      prompt += ` The theme of the poem is "${theme}".`;
    }
    prompt += ' Respond with only the title itself, without any extra text or quotation marks.';
    
    const title = await this.llmService.generate(prompt);
    return title.trim().replace(/"/g, '');
  }

  private async generateSeedLine(): Promise<string> {
    let prompt = `\n      Provide a single, famous, and thought-provoking quote from a well-known public figure \n      (e.g., a poet, scientist, politician, artist, or a line from a movie).\n`;
    if (this.userBio) { // Use userBio in prompt
      prompt += ` The quote should resonate with someone who is: ${this.userBio}.`;
    }
    prompt += `\n      Respond with only the quote itself, without any extra text or quotation marks.\n    `;
    const line = await this.llmService.generate(prompt);
    return line.trim();
  }

  private async generateNextLine(poem: Poem, theme?: string, style?: string): Promise<string> {
    let prompt = `\n      You are a poet creating a new poem. Here is the poem so far:\n      ---\n      Title: ${poem.title}\n      ${poem.lines.join('\n')}\n      ---\n`;

    if (this.userBio) { // Use userBio in prompt
      prompt += `\n      The poet's perspective: ${this.userBio}.`;
    }

    prompt += `\n      Your task is to add the next single line to continue the poem.\n      The line should be creative and fit the existing theme and rhythm.\n      The poem should have a clear narrative arc.\n    `;

    if (theme && theme.toLowerCase() !== 'random') {
      prompt += `\nThe poem's theme must be: ${theme}.`;
    }

    if (style && style.toLowerCase() !== 'random') {
      const lowerCaseStyle = style.toLowerCase();
      prompt += `\nThe poem must be in the style of a ${style}. Adhere strictly to its structure, rhythm, and rhyme scheme.`;

      if (lowerCaseStyle === 'haiku') {
        if (poem.lines.length === 1) {
          prompt += ' This next line should have 7 syllables.';
        } else if (poem.lines.length === 2) {
          prompt += ' This next line should have 5 syllables and conclude the haiku.';
        }
      } else if (lowerCaseStyle === 'limerick') {
        if (poem.lines.length === 1 || poem.lines.length === 2 || poem.lines.length === 5) {
          prompt += ' This line should rhyme with the first line and follow an anapestic rhythm (da-da-DUM).';
        } else if (poem.lines.length === 3 || poem.lines.length === 4) {
          prompt += ' This line should rhyme with the third line and follow an anapestic rhythm (da-da-DUM).';
        }
        prompt += ' The rhyme scheme is AABBA.';
      } else if (lowerCaseStyle === 'sonnet') {
        prompt += ' This is a Shakespearean sonnet. The poem will have 14 lines with an ABAB CDCD EFEF GG rhyme scheme.';
        if (poem.lines.length === 1 || poem.lines.length === 3) { // A lines
          prompt += ' This line should rhyme with the first line of its quatrain.';
        } else if (poem.lines.length === 2 || poem.lines.length === 4) { // B lines
          prompt += ' This line should rhyme with the second line of its quatrain.';
        } else if (poem.lines.length === 5 || poem.lines.length === 7) { // C lines
          prompt += ' This line should rhyme with the first line of its quatrain.';
        } else if (poem.lines.length === 6 || poem.lines.length === 8) { // D lines
          prompt += ' This line should rhyme with the second line of its quatrain.';
        } else if (poem.lines.length === 9 || poem.lines.length === 11) { // E lines
          prompt += ' This line should rhyme with the first line of its quatrain.';
        } else if (poem.lines.length === 10 || poem.lines.length === 12) { // F lines
          prompt += ' This line should rhyme with the second line of its quatrain.';
        } else if (poem.lines.length === 13 || poem.lines.length === 14) { // G lines (couplet)
          prompt += ' This line should rhyme with the previous line to form a rhyming couplet.';
        }
      }
    }

    prompt += '\nRespond with only the single new line, without any extra text or quotation marks.';

    const nextLine = await this.llmService.generate(prompt);
    return nextLine.trim();
  }

  private async checkIfComplete(poem: Poem, style?: string): Promise<boolean> {
    const lowerCaseStyle = style?.toLowerCase();
    if (lowerCaseStyle && lowerCaseStyle !== 'random') {
      if (lowerCaseStyle === 'haiku' && poem.lines.length >= 3) {
        return true;
      }
      if (lowerCaseStyle === 'limerick' && poem.lines.length >= 5) {
        return true;
      }
      if (lowerCaseStyle === 'sonnet' && poem.lines.length >= 14) {
        return true;
      }
    }

    const prompt = `\n      Here is a poem:\n      ---\n      Title: ${poem.title}\n      ${poem.lines.join('\n')}\n      ---\n      Considering its narrative arc and thematic development, does this poem feel complete and finished?\n      The poem should not end abruptly. It should feel resolved.\n      Answer with only the word "yes" or "no".\n    `;
    const response = await this.llmService.generate(prompt);
    return response.trim().toLowerCase().includes('yes');
  }
}