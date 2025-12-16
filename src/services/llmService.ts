export interface LlmService {
  generate(prompt: string): Promise<string>;
  listModels(): Promise<string[]>;
}
