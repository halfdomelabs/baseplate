// @ts-check
import path from 'node:path';

const PLUGIN_MANIFEST = {
  description: 'Description for plugin goes here',
  files: ['LICENSE', 'dist/**/*', 'CHANGELOG', 'manifest.json'],
  scripts: {
    build: 'concurrently pnpm:build:*',
    'build:static':
      'cpx "src/**/{templates/**,static/**,metadata.json}" "dist/" --clean',
    'build:tsc': 'tsc -p tsconfig.build.json && tsc-alias',
    'build:vite': 'vite build',
    clean: 'rm -rf ./dist',
    lint: 'eslint .',
    'prettier:check': 'prettier --check .',
    'prettier:write': 'prettier -w .',
    typecheck: 'tsc --noEmit',
    watch: 'concurrently pnpm:watch:*',
    'watch:static': 'pnpm build:static --watch',
    'watch:tsc': 'tsc -p tsconfig.build.json --preserveWatchOutput -w',
    'watch:tsc-alias': 'tsc-alias -w',
    'watch:vite': 'vite build --watch',
  },
  dependencies: {
    '@halfdomelabs/core-generators': 'workspace:*',
    '@halfdomelabs/fastify-generators': 'workspace:*',
    '@halfdomelabs/react-generators': 'workspace:*',
    '@halfdomelabs/ui-components': 'workspace:*',
    '@halfdomelabs/utils': 'workspace:*',
    react: 'catalog:',
    'react-dom': 'catalog:',
    zod: 'catalog:',
  },
  peerDependencies: {
    '@halfdomelabs/project-builder-lib': 'workspace:*',
    '@halfdomelabs/sync': 'workspace:*',
  },
};

function assignIfMissing(targetObj, sourceObj) {
  for (const key in sourceObj) {
    if (targetObj[key] === undefined) {
      targetObj[key] = sourceObj[key];
    }
  }
}

const INITIAL_PACKAGE_JSON = {
  scripts: {
    build: 'concurrently pnpm:build:*',
    'build:tsc': 'tsc -p tsconfig.build.json && tsc-alias',
    clean: 'rm -rf ./dist',
    lint: 'eslint .',
    'prettier:check': 'prettier --check .',
    'prettier:write': 'prettier -w .',
    test: 'vitest',
    'test:coverage': 'vitest run --coverage',
    typecheck: 'tsc --noEmit',
    watch: 'concurrently pnpm:watch:*',
    'watch:tsc': 'tsc -p tsconfig.build.json --preserveWatchOutput -w',
    'watch:tsc-alias': 'tsc-alias -w',
  },
  devDependencies: {
    '@halfdomelabs/tools': 'workspace:*',
    '@types/node': 'catalog:',
    concurrently: '9.0.1',
    eslint: 'catalog:',
    'tsc-alias': 'catalog:',
    typescript: 'catalog:',
    vitest: 'catalog:',
  },
};

/**
 * Generate a package.json for a particular directory
 *
 * @param {any} manifest
 * @param {string} dir
 * @returns {any}
 */
export function generatePackageJson(manifest, dir) {
  const commonManifest = {
    name: `@halfdomelabs/${path.basename(dir)}`,
    version: '0.1.0',
    description: 'Package description goes here',
    repository: 'https://github.com/halfdomelabs/baseplate',
    license: 'SEE LICENSE IN LICENSE',
    author: 'Half Dome Labs LLC',
    type: 'module',
    files: ['LICENSE', 'dist/**/*', 'CHANGELOG'],
    engines: {
      node: '^22.0.0',
    },
    volta: {
      extends: '../../package.json',
    },
    publishConfig: {
      access: 'restricted',
    },
  };
  const parentDirectory = path.basename(path.dirname(dir));
  if (manifest.private) {
    return manifest;
  }
  const defaults = {
    ...(!manifest ? INITIAL_PACKAGE_JSON : {}),
    ...commonManifest,
    ...(parentDirectory === 'plugins' ? PLUGIN_MANIFEST : {}),
  };
  assignIfMissing(manifest ?? {}, defaults);
  return manifest;
}
