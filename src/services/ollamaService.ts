import { Ollama } from 'ollama';
import type { LlmService } from './llmService.js';

function handleError(error: unknown, context: string): never {
  if (error instanceof Error) {
    console.error(`Error ${context}:`, error.message);
    throw error;
  }
  console.error(`An unknown error occurred ${context}:`, error);
  throw new Error(`An unknown error occurred ${context}`);
}

export class OllamaService implements LlmService {
  private ollama: Ollama;

  constructor(private model: string) {
    this.ollama = new Ollama();
  }

  public async generate(prompt: string): Promise<string> {
    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        stream: false,
      });
      return response.response;
    } catch (error) {
      handleError(error, `generating response from Ollama model "${this.model}"`);
    }
  }

  public async listModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      if (!response.models) {
        return [];
      }
      return response.models.map((model) => model.name);
    } catch (error) {
      handleError(error, 'listing models from Ollama');
    }
  }

  public static async findBestAvailableModel(): Promise<string> {
    try {
      const ollama = new Ollama();
      const response = await ollama.list();
      if (!response.models || response.models.length === 0) {
        throw new Error('No local models found in Ollama. Please run `ollama pull <model_name>`.');
      }

      const instructModel = response.models.find(m => m.name.includes('instruct'));
      if (instructModel) {
        return instructModel.name;
      }

      const smallModel = response.models.find(m => m.name.includes('8b'));
      if (smallModel) {
          return smallModel.name;
      }

      return response.models[0].name;
    } catch (error) {
      handleError(error, 'auto-selecting a model from Ollama');
    }
  }
}