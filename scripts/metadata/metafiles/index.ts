import type { MetafileDefinition } from '../config/types.js';

import packageJsonMetafile from './package-json.js';
import gitignoreMetafile from './gitignore.js';
import licenseMetafile from './license.js';
import eslintConfigMetafile from './eslint-config.js';
import prettierConfigMetafile from './prettier-config.js';

// Export all metafiles as an array
export const METAFILES: MetafileDefinition[] = [
  packageJsonMetafile,
  gitignoreMetafile,
  licenseMetafile,
  eslintConfigMetafile,
  prettierConfigMetafile,
];

// Re-export utility functions from package-json for the generate command
export { 
  getPackageJsonTemplate, 
  getRequiredScripts, 
  getRequiredDevDependencies 
} from './package-json.js';