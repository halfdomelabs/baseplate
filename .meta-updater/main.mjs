// @ts-check
import { createFormat, createUpdateOptions } from '@pnpm/meta-updater';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { generatePackageJson } from './package-json.mjs';
import { GITIGNORE_CONTENTS } from './gitignore.mjs';
import { createEslintConfig } from './eslint.mjs';

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

export default () => {
  return createUpdateOptions({
    files: {
      'package.json': async (/** @type {any} */ manifest, { dir }) => {
        return generatePackageJson(manifest, dir);
      },
      '.gitignore [#raw]': async (/** @type {any} */ contents) => {
        return contents ?? GITIGNORE_CONTENTS;
      },
      'eslint.config.js [#raw]': async (
        /** @type {any} */ contents,
        { dir },
      ) => {
        return contents ?? createEslintConfig(dir);
      },
    },
    formats: {
      '#raw': rawFormat,
    },
  });
};
