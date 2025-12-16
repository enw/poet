import { Command } from 'commander';
import { PoetAgent } from '../agent/poetAgent.js';
import { OllamaService } from '../services/ollamaService.js';
import type { LlmService } from '../services/llmService.js';
import pkg from '../../package.json' with { type: 'json' };
import inquirer from 'inquirer';
import type { DistinctQuestion } from 'inquirer';

// --- Helper Functions ---

function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error('\n❌ An error occurred:', error.message);
  } else {
    console.error('\n❌ An unknown error occurred:', error);
  }
  process.exit(1);
}

// Suggested themes and styles for interactive mode
const suggestedThemes = [
  'Nature', 'Love', 'Technology', 'Existentialism', 'Urban Life',
  'Dreams', 'Loss', 'Hope', 'Adventure', 'Solitude', 'Time', 'Memory'
];

const suggestedStyles = [
  'Free Verse', 'Haiku', 'Sonnet', 'Limerick', 'Blank Verse',
  'Ode', 'Elegy', 'Ballad', 'Sestina', 'Acrostic', 'Hip-Hop'
];

// --- CLI Modes ---

/**
 * Runs the interactive setup process to collect parameters from the user.
 */
async function runInteractiveMode() {
  console.log('🤖 Starting interactive poem setup...');
  
  const availableModels = await new OllamaService('').listModels();
  const defaultModel = await OllamaService.findBestAvailableModel();

  const questions: DistinctQuestion[] = [
    {
      type: 'rawlist', // Changed from 'list'
      name: 'model',
      message: 'Select the LLM model to use:',
      choices: availableModels.length > 0 ? availableModels : ['No models found. Please run `ollama pull <model_name>`.'],
      default: defaultModel,
      when: availableModels.length > 0, // Only ask if models are available
    },
    {
      type: 'input',
      name: 'title',
      message: 'Enter a title (or press Enter for a generated one):',
      default: '',
    },
    {
      type: 'input',
      name: 'seedLine',
      message: 'Enter a seed line (or press Enter for a generated one):',
      default: '',
    },
    {
      type: 'rawlist', // Changed from 'list'
      name: 'theme',
      message: 'Select a theme (or choose "Custom Theme" to type your own):',
      choices: suggestedThemes.concat('Custom Theme'), // Simplified choices
      default: 'Nature',
    },
    {
      type: 'input',
      name: 'customTheme',
      message: 'Enter your custom theme:',
      when: (answers: any) => answers.theme === 'Custom Theme', // Changed type annotation
    },
    {
      type: 'rawlist', // Changed from 'list'
      name: 'style',
      message: 'Select a poetic style (or choose "Custom Style" to type your own):',
      choices: suggestedStyles.concat('Custom Style'), // Simplified choices
      default: 'Free Verse',
    },
    {
      type: 'input',
      name: 'customStyle',
      message: 'Enter your custom style:',
      when: (answers: any) => answers.style === 'Custom Style', // Changed type annotation
    },
  ];

  const answers = await inquirer.prompt(questions);

  const finalModel = answers.model || defaultModel; // Fallback if no models were listed
  const finalTheme = answers.theme === 'Custom Theme' ? answers.customTheme : answers.theme;
  const finalStyle = answers.style === 'Custom Style' ? answers.customStyle : answers.style;

  console.log(`\n✅ Using model: ${finalModel}`);
  if (finalTheme) console.log(`✅ Theme: ${finalTheme}`);
  if (finalStyle) console.log(`✅ Style: ${finalStyle}`);
  console.log('\n');

  const llmService: LlmService = new OllamaService(finalModel);
  const agent = new PoetAgent(llmService);
  await agent.run({ 
    title: answers.title, 
    seedLine: answers.seedLine, 
    theme: finalTheme, 
    style: finalStyle 
  });
}

/**
 * Runs the standard non-interactive mode based on CLI flags.
 * @param options - The options object from Commander.
 */
async function runStandardMode(options: { [key: string]: any }) {
  let modelName = options.model;
  if (!modelName) {
    console.log('🤖 No model specified, attempting to find the best available model...');
    modelName = await OllamaService.findBestAvailableModel();
    console.log(`✅ Found model: ${modelName}\n`);
  } else {
    console.log(`🤖 Using specified model: ${modelName}\n`);
  }

  const llmService: LlmService = new OllamaService(modelName);
  const agent = new PoetAgent(llmService);
  await agent.run({
    title: options.title,
    seedLine: options.seedLine,
    theme: options.theme,
    style: options.style,
  });
}

// --- Main CLI Execution ---

export async function runCli() {
  const program = new Command();

  program
    .name('poet')
    .description('An iterative poet that creates poems line by line using a local LLM.')
    .version(pkg.version);

  program
    .command('create', { isDefault: true })
    .description('Create a new poem.')
    .option('-m, --model <model_name>', 'Specify the Ollama model to use.')
    .option('-t, --title <poem_title>', 'Seed the poem with a specific title.')
    .option('-s, --seed-line <famous_line>', 'Seed the poem with a specific starting line.')
    .option('--theme <theme>', 'Guide the poem with a specific theme.')
    .option('--style <style>', 'Guide the poem with a specific style (e.g., "haiku").')
    .option('-i, --interactive', 'Run in interactive mode to set up the poem.')
    .action(async (options) => {
      try {
        if (options.interactive) {
          await runInteractiveMode();
        } else {
          await runStandardMode(options);
        }
      } catch (error) {
        handleError(error);
      }
    });

  program
    .command('list-models')
    .description('List all available models from the local Ollama instance.')
    .action(async () => {
      try {
        const service = new OllamaService(''); 
        const models = await service.listModels();
        console.log('Available Ollama models:');
        if (models.length === 0) {
          console.log('  No models found. Run `ollama pull <model_name>` to get one.');
        } else {
          models.forEach(model => console.log(`  - ${model}`));
        }
      } catch (error) {
        handleError(error);
      }
    });

  await program.parseAsync(process.argv);
}