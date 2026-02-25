import { getPackageVersion } from '@baseplate-dev/utils/node';
import { createRequire } from 'node:module';

export async function getCliVersion(): Promise<string> {
  const require = createRequire(import.meta.url);
  const cliPackagePath = require.resolve('@baseplate-dev/project-builder-cli');
  const version = await getPackageVersion(cliPackagePath);

  if (!version) {
    throw new Error(
      `Unable to find version in package.json for @baseplate-dev/project-builder-cli in ${cliPackagePath}`,
    );
  }

  return version;
}
