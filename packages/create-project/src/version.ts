import { findNearestPackageJson } from '@baseplate-dev/utils/node';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

let cachedVersion: string | undefined | null;

export async function getPackageVersion(): Promise<string | null> {
  if (cachedVersion === undefined) {
    // Construct the path to the package.json file.
    const packageJsonPath = await findNearestPackageJson({
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

let cachedCliVersion: string | undefined;

export async function getCliVersion(): Promise<string> {
  if (cachedCliVersion === undefined) {
    // Use require.resolve to find the package.json for project-builder-cli
    const require = createRequire(import.meta.url);
    const cliPackagePath =
      require.resolve('@baseplate-dev/project-builder-cli');

    const packageJsonPath = await findNearestPackageJson({
      cwd: cliPackagePath,
    });

    if (!packageJsonPath) {
      throw new Error(
        `Could not find package.json for @baseplate-dev/project-builder-cli in ${cliPackagePath}`,
      );
    }
    // Read the package.json file
    const fileContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(fileContent) as { version: string };

    if (!packageJson.version) {
      throw new Error(
        `Unable to find version in package.json for @baseplate-dev/project-builder-cli in ${packageJsonPath}`,
      );
    }

    cachedCliVersion = packageJson.version;
  }

  return cachedCliVersion;
}
