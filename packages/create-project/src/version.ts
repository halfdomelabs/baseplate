import { getPackageVersion } from '@baseplate-dev/utils/node';
import { createRequire } from 'node:module';
import path from 'node:path';

export async function getCliVersion(): Promise<string> {
  const require = createRequire(import.meta.url);
  const cliEntryPath = require.resolve('@baseplate-dev/project-builder-cli');
  const version = await getPackageVersion(path.dirname(cliEntryPath));

  if (!version) {
    throw new Error(
      `Unable to find version in package.json for @baseplate-dev/project-builder-cli in ${cliEntryPath}`,
    );
  }

  return version;
}
