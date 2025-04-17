import { hasDependency, readPackageJson } from './utils.mjs';

export async function createPrettierConfig(dir) {
  const packageJson = await readPackageJson(dir);

  if (!hasDependency(packageJson, 'prettier')) {
    return null;
  }
  const hasReact = hasDependency(packageJson, 'react');

  return `
export { default } from '@halfdomelabs/tools/prettier-${hasReact ? 'react' : 'node'};
`.trimStart();
}
