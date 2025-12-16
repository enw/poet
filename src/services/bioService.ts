import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const BIO_FILE_NAME = '.me.toon'; // As mentioned by the user

export interface UserBio {
  content: string;
}

export class BioService {
  private bioFilePath: string;

  constructor() {
    this.bioFilePath = path.join(os.homedir(), BIO_FILE_NAME);
  }

  public async loadBio(): Promise<UserBio | null> {
    try {
      const content = await fs.readFile(this.bioFilePath, { encoding: 'utf-8' });
      return { content: content.trim() };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // File not found
      }
      console.error(`Error loading user bio from ${this.bioFilePath}:`, error.message);
      return null;
    }
  }
}