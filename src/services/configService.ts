import type { PoetConfig } from '../models/config.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const CONFIG_FILE_NAME = '.poet';

export class ConfigService {
  private configFilePath: string;

  constructor(workingDir: string = process.cwd()) {
    this.configFilePath = path.join(workingDir, CONFIG_FILE_NAME);
  }

  /**
   * Loads the configuration from the .poet file.
   * @returns The loaded configuration or null if not found/error.
   */
  public async loadConfig(): Promise<PoetConfig | null> {
    try {
      const content = await fs.readFile(this.configFilePath, { encoding: 'utf-8' });
      return JSON.parse(content) as PoetConfig;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File not found, which is expected for first run or if no config is saved
        return null;
      }
      console.error(`Error loading config from ${this.configFilePath}:`, error.message);
      return null;
    }
  }

  /**
   * Saves the given configuration to the .poet file.
   * @param config - The configuration object to save.
   */
  public async saveConfig(config: PoetConfig): Promise<void> {
    try {
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(this.configFilePath, content, { encoding: 'utf-8' });
      console.log(`✅ Settings saved to ${this.configFilePath}`);
    } catch (error: any) {
      console.error(`Error saving config to ${this.configFilePath}:`, error.message);
    }
  }
}
