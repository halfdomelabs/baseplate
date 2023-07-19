import { promises as fs } from 'fs';
import { fileURLToPath } from 'node:url';
import { pkgUp } from 'pkg-up';

let cachedVersion: string | undefined | null;

export async function getPackageVersion(): Promise<string | null> {
  if (cachedVersion === undefined) {
    // Construct the path to the package.json file.
    const packageJsonPath = await pkgUp({
      cwd: fileURLToPath(import.meta.url),
    });

    if (!packageJsonPath) {
      cachedVersion = null;
    } else {
      // Read the package.json file.
      const fileContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(fileContent) as { version: string };

      // Return the version.
      cachedVersion = packageJson.version || null;
    }
  }

  return cachedVersion;
}
