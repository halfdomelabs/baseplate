import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { packageUp } from 'package-up';

let cachedVersion: string | undefined | null;

export async function getPackageVersion(): Promise<string | null> {
  if (cachedVersion === undefined) {
    // Construct the path to the package.json file.
    const packageJsonPath = await packageUp({
      cwd: fileURLToPath(import.meta.url),
    });

    if (packageJsonPath) {
      // Read the package.json file.
      const fileContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(fileContent) as { version: string };

      // Return the version.
      cachedVersion = packageJson.version || null;
    } else {
      cachedVersion = null;
    }
  }

  return cachedVersion;
}
