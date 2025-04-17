// @ts-check
import { createFormat, createUpdateOptions } from '@pnpm/meta-updater';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { generatePackageJson } from './package-json.mjs';
import { GITIGNORE_CONTENTS } from './gitignore.mjs';

const rawFormat = createFormat({
  async read({ resolvedPath }) {
    return await fs.readFile(resolvedPath, 'utf8');
  },
  update(actual, updater, options) {
    return updater(actual, options);
  },
  equal(expected, actual) {
    return expected === actual;
  },
  async write(expected, { resolvedPath }) {
    await fs.writeFile(resolvedPath, expected, 'utf8');
  },
});

/**
 * Reads the package.json file from a directory
 * @param {string} dir - Directory path
 * @returns {Promise<object>} The package.json content or an empty object with name property
 */
const readPackageJson = async (dir) => {
  try {
    const packageJsonPath = path.join(dir, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    return JSON.parse(packageJsonContent);
  } catch (error) {
    return { name: '' };
  }
};

/**
 * Checks if a package depends on a specific dependency
 * @param {object} packageJson - The package.json content
 * @param {string} dependency - The dependency to check for
 * @returns {boolean} True if the dependency is found
 */
const hasDependency = (packageJson, dependency) => {
  return !!(
    (packageJson.dependencies && packageJson.dependencies[dependency]) ||
    (packageJson.devDependencies && packageJson.devDependencies[dependency]) ||
    (packageJson.peerDependencies && packageJson.peerDependencies[dependency])
  );
};

export default () => {
  return createUpdateOptions({
    files: {
      'package.json': async (/** @type {any} */ manifest, { dir }) => {
        return generatePackageJson(manifest, dir);
      },
      '.gitignore [#raw]': async (/** @type {any} */ contents) => {
        return contents ?? GITIGNORE_CONTENTS;
      },
    },
    formats: {
      '#raw': rawFormat,
    },
  });
};
