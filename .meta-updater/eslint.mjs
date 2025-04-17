import path from 'node:path';
import { hasDependency, readPackageJson } from './utils.mjs';

export async function createEslintConfig(dir) {
  const packageJson = await readPackageJson(dir);

  if (!hasDependency(packageJson, 'eslint')) {
    return null;
  }

  if (path.basename(dir) === 'plugins') {
    return `
import eslintReactConfig from '@halfdomelabs/tools/eslint-react';

export default [...eslintReactConfig, { ignores: ['**/templates/**'] }];
`.trimStart();
  }
  const hasReact = hasDependency(packageJson, 'react');

  return `
export { default } from '@halfdomelabs/tools/eslint-${hasReact ? 'react' : 'node'};
`.trimStart();
}
