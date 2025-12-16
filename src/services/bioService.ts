import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const BIO_FILE_NAME = '.me.toon';

export interface UserBio {
  content: string;
}

export class BioService {
  private bioFilePath: string;

  constructor() {
    this.bioFilePath = path.join(os.homedir(), BIO_FILE_NAME);
  }

  /**
   * Loads the user bio from the ~/.me.toon file.
   * @returns The user bio or null if not found.
   */
  public async loadBio(): Promise<UserBio | null> {
    try {
      const content = await fs.readFile(this.bioFilePath, { encoding: 'utf-8' });
      return { content: content.trim() };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File not found, which is expected if user hasn't created one
        return null;
      }
      console.error(`Error loading bio from ${this.bioFilePath}:`, error.message);
      return null;
    }
  }
}
