import { Command } from 'commander';
import { PoetAgent } from '../agent/poetAgent.js';
import { OllamaService } from '../services/ollamaService.js';
import type { LlmService } from '../services/llmService.js';
import pkg from '../../package.json' with { type: 'json' };
import * as readline from 'readline';

// --- Helper Functions ---

function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error('\n❌ An error occurred:', error.message);
  } else {
    console.error('\n❌ An unknown error occurred:', error);
  }
  process.exit(1);
}

/**
 * Asks a question to the user and returns their answer, or a default value.
 */
function askQuestion(rl: readline.Interface, query: string, defaultValue: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer || defaultValue);
    });
  });
}

// --- CLI Modes ---

/**
 * Runs the interactive setup process to collect parameters from the user.
 */
async function runInteractiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('🤖 Starting interactive poem setup...');
  
  const defaultModel = await OllamaService.findBestAvailableModel();
  const modelName = await askQuestion(rl, `Enter the model to use (default: ${defaultModel}): `, defaultModel);

  const title = await askQuestion(rl, 'Enter a title (or press Enter for a generated one): ', '');
  const seedLine = await askQuestion(rl, 'Enter a seed line (or press Enter for a generated one): ', '');
  const theme = await askQuestion(rl, 'Enter a theme (e.g., "love", "nature", or leave blank): ', '');
  const style = await askQuestion(rl, 'Enter a style (e.g., "haiku", "sonnet", or leave blank): ', '');

  rl.close();

  console.log(`\n✅ Using model: ${modelName}\n`);

  const llmService: LlmService = new OllamaService(modelName);
  const agent = new PoetAgent(llmService);
  await agent.run({ title, seedLine, theme, style });
}

/**
 * Runs the standard non-interactive mode based on CLI flags.
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