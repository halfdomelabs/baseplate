import { backendPackageCompiler } from './backend/index.js';
import { webPackageCompiler } from './web/index.js';

/**
 * Registry of package compilers
 */
export const PACKAGE_COMPILER_REGISTRY = {
  backend: backendPackageCompiler,
  web: webPackageCompiler,
};
