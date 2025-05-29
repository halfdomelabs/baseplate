import type { PackageInfo } from '../utils/workspace.js';
import type { MetafileDefinition } from '../config/types.js';
import { deepMerge } from '../utils/file-operations.js';
import { isCreateProjectPackage } from '../utils/workspace.js';

export interface PackageJsonTemplate {
  author?: string;
  repository?: any;
  license?: string;
  engines?: any;
  volta?: any;
  publishConfig?: any;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function getPackageJsonTemplate(pkg: PackageInfo): PackageJsonTemplate {
  const license = isCreateProjectPackage(pkg) ? 'MIT' : 'UNLICENSED';
  
  return {
    author: 'HD Labs Inc.',
    repository: {
      type: 'git',
      url: 'https://github.com/hdlabs/baseplate.git',
      directory: pkg.path.replace(`${process.cwd()}/`, ''),
    },
    license,
    engines: {
      node: '>=18',
    },
    volta: {
      extends: '../../package.json',
    },
    publishConfig: {
      access: 'public',
    },
  };
}

export function getRequiredScripts(pkg: PackageInfo): Record<string, string> {
  const baseScripts: Record<string, string> = {
    build: 'echo "No build"',
    clean: 'echo "No clean"',
    'lint:eslint': 'eslint --cache --cache-location ../../.eslintcache/',
    'lint:prettier': 'prettier --check . --ignore-path ../../.prettierignore',
    lint: 'run-p lint:*',
    'lint:fix': 'run-p "lint:* --fix"',
    test: 'pnpm -w run vitest:run',
    'test:watch': 'pnpm -w run vitest:watch',
    typecheck: 'tsc',
  };
  
  // Plugin-specific scripts
  if (pkg.isPlugin) {
    return {
      ...baseScripts,
      build: 'pnpm -w exec turbo build --filter=baseplate-plugin-builder',
      clean: 'rm -rf .turbo dist',
      dev: 'vite',
      lint: 'run-p lint:*',
      'test:builder':
        'cd ../../ && pnpm build:project-builder:lib && PROJECT_DEFINITION_PATH=plugins/example/baseplate/project-definition.json pnpm test:int',
    };
  }
  
  // Check if it has a build script already
  const existingBuild = pkg.packageJson.scripts?.build;
  if (existingBuild && existingBuild !== 'echo "No build"') {
    baseScripts.build = existingBuild;
  }
  
  return baseScripts;
}

export function getRequiredDevDependencies(pkg: PackageInfo): Record<string, string> {
  const deps: Record<string, string> = {
    'npm-run-all2': '^7.0.0',
  };
  
  // Add TypeScript if the package has it
  if (pkg.packageJson.devDependencies?.typescript) {
    deps.typescript = pkg.packageJson.devDependencies.typescript;
  }
  
  return deps;
}

function generatePackageJson(pkg: PackageInfo): any {
  const template = getPackageJsonTemplate(pkg);
  const scripts = getRequiredScripts(pkg);
  const devDependencies = getRequiredDevDependencies(pkg);
  
  const fullTemplate = {
    ...template,
    scripts,
    devDependencies,
  };
  
  const currentJson = pkg.packageJson;
  const updatedJson = deepMerge(currentJson, fullTemplate);
  
  // Preserve existing values for certain fields
  if (currentJson.name) updatedJson.name = currentJson.name;
  if (currentJson.version) updatedJson.version = currentJson.version;
  if (currentJson.description) updatedJson.description = currentJson.description;
  
  return updatedJson;
}

const packageJsonMetafile: MetafileDefinition = {
  fileName: 'package.json',
  shouldExist: () => true,
  getContent: generatePackageJson,
  format: true,
};

export default packageJsonMetafile;