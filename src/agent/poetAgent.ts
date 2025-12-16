import type { LlmService } from '../services/llmService.js';
import { Poem } from '../models/poem.js';

interface RunOptions {
  title?: string;
  seedLine?: string;
  theme?: string;
  style?: string;
  userBio?: string; // Added userBio to RunOptions
  guidance?: string; // Free-form guidance for the poem
}

/**
 * The PoetAgent orchestrates the entire process of creating a poem.
 */
export class PoetAgent {
  // The agent depends on the LlmService abstraction, not a concrete implementation.
  private userBio?: string; // Added userBio property
  private guidance?: string; // Free-form guidance for the poem

  constructor(private llmService: LlmService) {}

  /**
   * Runs the iterative poem generation process.
   * @param options - Configuration for the run.
   * @returns The completed Poem object.
   */
  /**
   * Extracts a target line count from guidance text (e.g., "24 lines long" -> 24)
   */
  private extractLineCount(guidance?: string): number | null {
    if (!guidance) return null;
    const match = guidance.match(/(\d+)\s*lines?\s*(long|in length|total)?/i);
    if (match) {
      const count = parseInt(match[1], 10);
      return count > 0 ? count : null;
    }
    return null;
  }

  public async run(options: RunOptions = {}): Promise<Poem> {
    const { title, seedLine, theme, style, userBio, guidance } = options;
    this.userBio = userBio; // Assign userBio to property
    this.guidance = guidance; // Store guidance
    console.log('✨ Starting poem generation...');

    const finalTitle = title || await this.generateTitle(theme);
    const firstLine = seedLine || await this.generateSeedLine();
    
    const poem = new Poem(finalTitle, [firstLine]);
    console.log(`\nTitle: ${poem.title}`);
    console.log('--------------------');
    console.log(poem.lines[0]);

    let isComplete = false;
    let maxLines = 12; // Default max lines
    
    // Check if guidance specifies a line count
    const guidanceLineCount = this.extractLineCount(guidance);
    if (guidanceLineCount) {
      maxLines = guidanceLineCount;
      console.log(`📏 Target length from guidance: ${maxLines} lines\n`);
    } else {
      // Otherwise, use style-based limits
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
    }

    while (!isComplete && poem.lines.length < maxLines) {
      const nextLine = await this.generateNextLine(poem, theme, style);
      poem.addLine(nextLine);
      console.log(nextLine);
      
      // If guidance specifies a length, only check for completion when we've reached it
      // Otherwise, check after minimum 3 lines or when reaching max lines
      const guidanceLineCount = this.extractLineCount(this.guidance);
      if (guidanceLineCount) {
        // For guidance-specified lengths, only check completion once we've reached the target
        if (poem.lines.length >= guidanceLineCount) {
          isComplete = await this.checkIfComplete(poem, style);
        }
        // Continue generating until we reach the target (don't allow early completion)
      } else {
        // No guidance length specified, use normal completion check
        if (poem.lines.length >= 3 || poem.lines.length >= maxLines) {
          isComplete = await this.checkIfComplete(poem, style);
        }
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
    if (this.guidance) {
      prompt += ` IMPORTANT: Follow this guidance carefully - ${this.guidance}`;
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
    if (this.guidance) {
      prompt += ` IMPORTANT: Consider this guidance when selecting the quote - ${this.guidance}.`;
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

    if (this.guidance) {
      prompt += `\n\n*** CRITICAL GUIDANCE - FOLLOW THIS CAREFULLY ***\n${this.guidance}\n*** END OF GUIDANCE ***\n\n`;
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
    // Check if guidance specifies a line count
    const guidanceLineCount = this.extractLineCount(this.guidance);
    
    // If guidance specifies a length, we should only reach this check when we've met the length
    // So we can allow completion, but still check if it feels complete
    if (guidanceLineCount && poem.lines.length < guidanceLineCount) {
      // Shouldn't happen due to loop logic, but safety check
      return false;
    }
    
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

    let prompt = `\n      Here is a poem:\n      ---\n      Title: ${poem.title}\n      ${poem.lines.join('\n')}\n      ---\n      The poem currently has ${poem.lines.length} lines.\n      \n`;
    
    if (guidanceLineCount) {
      // When guidance specifies a length, make it absolutely clear
      if (poem.lines.length >= guidanceLineCount) {
        prompt += `*** CRITICAL REQUIREMENT: The guidance specified that the poem MUST be ${guidanceLineCount} lines long. The poem now has ${poem.lines.length} lines, which meets this requirement. ***\n\n`;
        prompt += `Considering its narrative arc and thematic development, does this poem feel complete and finished now that it has reached the required length of ${guidanceLineCount} lines?\n`;
      } else {
        prompt += `*** CRITICAL: The guidance requires the poem to be ${guidanceLineCount} lines long, but it currently only has ${poem.lines.length} lines. ***\n\n`;
        prompt += `The poem is NOT complete yet because it has not reached the required length. Answer "no".\n`;
        // Return false immediately if we haven't reached the required length
        return false;
      }
    } else {
      prompt += `Considering its narrative arc and thematic development, does this poem feel complete and finished?\n      The poem should not end abruptly. It should feel resolved.\n    `;
    }
    
    if (this.guidance && !guidanceLineCount) {
      // If there's guidance but no length specified, include it normally
      prompt += `\n\n*** IMPORTANT GUIDANCE TO CONSIDER: ${this.guidance} ***\n`;
      prompt += `When determining if the poem is complete, you MUST consider whether it satisfies the guidance above.\n`;
    }
    
    prompt += `\nAnswer with only the word "yes" or "no".\n    `;
    
    const response = await this.llmService.generate(prompt);
    return response.trim().toLowerCase().includes('yes');
  }
}