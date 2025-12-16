import { Command } from 'commander';
import { PoetAgent } from '../agent/poetAgent.js';
import { OllamaService } from '../services/ollamaService.js';
import type { LlmService } from '../services/llmService.js';
import pkg from '../../package.json' with { type: 'json' };

function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error('\n❌ An error occurred:', error.message);
  } else {
    console.error('\n❌ An unknown error occurred:', error);
  }
  process.exit(1);
}

export async function runCli() {
  const program = new Command();

  program
    .name('poet')
    .description('An iterative poet that creates poems line by line using a local LLM.')
    .version(pkg.version);

  program
    .command('create', { isDefault: true })
    .description('Create a new poem (default command).')
    .option('-m, --model <model_name>', 'Specify the Ollama model to use.')
    .option('-t, --title <poem_title>', 'Seed the poem with a specific title.')
    .option('-s, --seed-line <famous_line>', 'Seed the poem with a specific starting line.')
    .action(async (options) => {
      try {
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
        await agent.run(options.title, options.seedLine);
      } catch (error) {
        handleError(error);
      }
    });

  program
    .command('list-models')
    .description('List all available models from the local Ollama instance.')
    .action(async () => {
      try {
        // A model name is required by the constructor, but not used by listModels.
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
