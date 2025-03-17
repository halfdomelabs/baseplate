import { findNearestPackageJson } from '@halfdomelabs/utils/node';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';

let cachedVersion: string | undefined;

export async function getPackageVersion(): Promise<string> {
  if (cachedVersion === undefined) {
    // Construct the path to the package.json file.
    const packageJsonPath = await findNearestPackageJson({
      cwd: fileURLToPath(import.meta.url),
    });

    if (packageJsonPath) {
      // Read the package.json file.
      const fileContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(fileContent) as {
        version: string | undefined;
      };

      if (!packageJson.version) {
        throw new Error('Unable to find version in package.json');
      }

      // Return the version.
      cachedVersion = packageJson.version;
    } else {
      throw new Error('Unable to find package.json');
    }
  }

  return cachedVersion;
}
