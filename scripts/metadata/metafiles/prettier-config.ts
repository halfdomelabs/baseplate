import type { PackageInfo } from '../utils/workspace.js';
import type { MetafileDefinition } from '../config/types.js';

function getPrettierConfigContent(pkg: PackageInfo): string {
  const isReact = pkg.isReactPackage;
  const configName = isReact
    ? '@baseplate/tools/react-prettierrc'
    : '@baseplate/tools/node-prettierrc';
  
  return `export { default } from '${configName}';\n`;
}

const prettierConfigMetafile: MetafileDefinition = {
  fileName: 'prettier.config.js',
  shouldExist: (pkg) =>
    !!(
      pkg.packageJson.devDependencies?.prettier ||
      pkg.packageJson.dependencies?.prettier
    ),
  getContent: getPrettierConfigContent,
  format: true,
};

export default prettierConfigMetafile;