import { backendPackageCompiler } from './backend/backend-compiler.js';
import { webPackageCompiler } from './web/web-compiler.js';

/**
 * Registry of package compilers
 */
export const PACKAGE_COMPILER_REGISTRY = {
  backend: backendPackageCompiler,
  web: webPackageCompiler,
};
