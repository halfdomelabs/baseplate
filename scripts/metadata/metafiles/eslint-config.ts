import type { PackageInfo } from '../utils/workspace.js';
import type { MetafileDefinition } from '../config/types.js';

function getEslintConfigContent(pkg: PackageInfo): string {
  const isReact = pkg.isReactPackage;
  const configName = isReact
    ? '@baseplate/tools/react-eslintrc'
    : '@baseplate/tools/node-eslintrc';
  
  let content = `import config from '${configName}';

export default [...config];\n`;

  // Add plugin-specific ignores
  if (pkg.isPlugin) {
    content = `import config from '${configName}';

export default [
  ...config,
  {
    ignores: ['**/templates/**'],
  },
];\n`;
  }
  
  return content;
}

const eslintConfigMetafile: MetafileDefinition = {
  fileName: 'eslint.config.js',
  shouldExist: (pkg) =>
    !!(
      pkg.packageJson.devDependencies?.eslint ||
      pkg.packageJson.dependencies?.eslint
    ),
  getContent: getEslintConfigContent,
  format: true,
};

export default eslintConfigMetafile;