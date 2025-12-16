import { Command } from 'commander';
import { PoetAgent } from '../agent/poetAgent.js';
import { OllamaService } from '../services/ollamaService.js';
import type { LlmService } from '../services/llmService.js';
import { ConfigService } from '../services/configService.js'; // New import
import type { PoetConfig } from '../models/config.js'; // New import
import { BioService } from '../services/bioService.js'; // New import
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
  'Dreams', 'Loss', 'Hope', 'Adventure', 'Solitude', 'Time', 'Memory', 'Random'
];

const suggestedStyles = [
  'Free Verse', 'Haiku', 'Sonnet', 'Limerick', 'Blank Verse',
  'Ode', 'Elegy', 'Ballad', 'Sestina', 'Acrostic', 'Hip-Hop', 'Random'
];

// Helper function to get a random selection from an array
function getRandomSelection<T>(array: T[], excludeItems: T[] = []): T {
  const filtered = array.filter(item => !excludeItems.includes(item));
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// --- CLI Modes ---

/**
 * Runs the interactive setup process to collect parameters from the user.
 */
async function runInteractiveMode(poetConfig: PoetConfig | null, userBio: string | null) {
  console.log('🤖 Starting interactive poem setup...');
  if (userBio) {
    console.log(`✅ Loaded user bio from ~/.me.toon\n`);
  }
  
  const availableModels = await new OllamaService('').listModels();
  const defaultModel = await OllamaService.findBestAvailableModel();

  const questions: DistinctQuestion[] = [
    {
      type: 'rawlist',
      name: 'model',
      message: 'Select the LLM model to use:',
      choices: availableModels.length > 0 ? availableModels : ['No models found. Please run `ollama pull <model_name>`.'],
      default: poetConfig?.model || defaultModel, // Use config as default
      when: availableModels.length > 0,
    },
    {
      type: 'input',
      name: 'title',
      message: 'Enter a title (or press Enter for a generated one):',
      default: poetConfig?.title || '', // Use config as default
    },
    {
      type: 'input',
      name: 'seedLine',
      message: 'Enter a seed line (or press Enter for a generated one):',
      default: poetConfig?.seedLine || '', // Use config as default
    },
    {
      type: 'rawlist',
      name: 'theme',
      message: 'Select a theme (or choose "Custom Theme" to type your own):',
      choices: suggestedThemes.concat('Custom Theme'),
      default: poetConfig?.theme || 'Nature', // Use config as default
    },
    {
      type: 'input',
      name: 'customTheme',
      message: 'Enter your custom theme:',
      when: (answers: any) => answers.theme === 'Custom Theme',
    },
    {
      type: 'rawlist',
      name: 'style',
      message: 'Select a poetic style (or choose "Custom Style" to type your own):',
      choices: suggestedStyles.concat('Custom Style'),
      default: poetConfig?.style || 'Free Verse', // Use config as default
    },
    {
      type: 'input',
      name: 'customStyle',
      message: 'Enter your custom style:',
      when: (answers: any) => answers.style === 'Custom Style',
    },
    {
      type: 'input',
      name: 'guidance',
      message: 'Enter any additional guidance for the poem (or press Enter to skip):',
      default: '',
    },
  ];

  const answers = await inquirer.prompt(questions);

  const finalModel = answers.model || defaultModel;
  let finalTheme = answers.theme === 'Custom Theme' ? answers.customTheme : answers.theme;
  let finalStyle = answers.style === 'Custom Style' ? answers.customStyle : answers.style;

  // Handle "Random" selections
  if (finalTheme === 'Random') {
    finalTheme = getRandomSelection(suggestedThemes, ['Random', 'Custom Theme']);
    console.log(`\n🎲 Random theme selected: ${finalTheme}`);
  }
  if (finalStyle === 'Random') {
    finalStyle = getRandomSelection(suggestedStyles, ['Random', 'Custom Style']);
    console.log(`🎲 Random style selected: ${finalStyle}`);
  }

  console.log(`\n✅ Using model: ${finalModel}`);
  if (finalTheme) console.log(`✅ Theme: ${finalTheme}`);
  if (finalStyle) console.log(`✅ Style: ${finalStyle}`);
  if (answers.guidance) console.log(`✅ Guidance: ${answers.guidance}`);
  console.log('\n');

  const llmService: LlmService = new OllamaService(finalModel);
  const agent = new PoetAgent(llmService);
  await agent.run({ 
    title: answers.title, 
    seedLine: answers.seedLine, 
    theme: finalTheme, 
    style: finalStyle,
    userBio: userBio || undefined, // Pass userBio
    guidance: answers.guidance || undefined // Pass guidance
  });
}

/**
 * Runs the standard non-interactive mode based on CLI flags.
 */
async function runStandardMode(options: { [key: string]: any }, poetConfig: PoetConfig | null, userBio: string | null) {
  let modelName = options.model || poetConfig?.model;
  if (!modelName) {
    console.log('🤖 No model specified, attempting to find the best available model...');
    modelName = await OllamaService.findBestAvailableModel();
    console.log(`✅ Found model: ${modelName}\n`);
  } else {
    console.log(`🤖 Using specified model: ${modelName}\n`);
  }

  // Handle "Random" selections for theme and style
  let theme = options.theme || poetConfig?.theme;
  let style = options.style || poetConfig?.style;

  if (theme === 'Random') {
    theme = getRandomSelection(suggestedThemes, ['Random']);
    console.log(`🎲 Random theme selected: ${theme}`);
  }
  if (style === 'Random') {
    style = getRandomSelection(suggestedStyles, ['Random']);
    console.log(`🎲 Random style selected: ${style}`);
  }

  const llmService: LlmService = new OllamaService(modelName);
  const agent = new PoetAgent(llmService);
  await agent.run({
    title: options.title || poetConfig?.title,
    seedLine: options.seedLine || poetConfig?.seedLine,
    theme: theme,
    style: style,
    userBio: userBio || undefined, // Pass userBio
    guidance: options.guidance // Pass guidance
  });
}

// --- Main CLI Execution ---

export async function runCli() {
  const program = new Command();
  const configService = new ConfigService(); // Instantiate ConfigService
  const poetConfig = await configService.loadConfig(); // Load config

  const bioService = new BioService(); // Instantiate BioService
  const userBioData = await bioService.loadBio(); // Load user bio
  const userBio = userBioData?.content || null;

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
    .option('-g, --guidance <guidance>', 'Provide free-form guidance for the poem (e.g., "make it about dancing in the autumn").')
    .option('-i, --interactive', 'Run in interactive mode to set up the poem.')
    .action(async (options) => {
      try {
        if (options.interactive) {
          await runInteractiveMode(poetConfig, userBio); // Pass config and userBio
        } else {
          await runStandardMode(options, poetConfig, userBio); // Pass config and userBio
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

  // New command: save-config
  program
    .command('save-config')
    .description('Save current settings to a .poet file for future use.')
    .option('-m, --model <model_name>', 'Model to save.')
    .option('-t, --title <poem_title>', 'Title to save.')
    .option('-s, --seed-line <famous_line>', 'Seed line to save.')
    .option('--theme <theme>', 'Theme to save.')
    .option('--style <style>', 'Style to save.')
    .action(async (options) => {
      try {
        const configToSave: PoetConfig = {
          model: options.model,
          title: options.title,
          seedLine: options.seedLine,
          theme: options.theme,
          style: options.style,
        };
        await configService.saveConfig(configToSave);
      } catch (error) {
        handleError(error);
      }
    });

  await program.parseAsync(process.argv);
}