import { findNearestPackageJson } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function getCliVersion(): Promise<string> {
  const packageJsonPath = await findNearestPackageJson({
    cwd: fileURLToPath(import.meta.url),
  });
  if (!packageJsonPath) {
    throw new Error('Could not find package.json');
  }
  const cliPackageJson = path.join(
    path.dirname(packageJsonPath),
    '../project-builder-cli/package.json',
  );
  const fileContent = await fs.readFile(cliPackageJson, 'utf8');
  const packageJson = JSON.parse(fileContent) as { version: string };
  return packageJson.version;
}
