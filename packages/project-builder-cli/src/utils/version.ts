import { promises as fs } from 'fs';
import * as path from 'path';

let cachedVersion: string | null = null;

export async function getPackageVersion(): Promise<string | null> {
  if (!cachedVersion) {
    // Construct the path to the package.json file.
    const packageJsonPath = path.join(__dirname, '../../package.json');

    // Read the package.json file.
    const fileContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(fileContent) as { version: string };

    // Return the version.
    cachedVersion = packageJson.version || null;
  }

  return cachedVersion;
}
