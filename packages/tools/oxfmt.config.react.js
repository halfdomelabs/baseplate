// @ts-check

import { oxfmtConfigBase, oxfmtIgnorePatterns } from './oxfmt.config.base.js';

/**
 * Config for packages that use Tailwind. Expects a `src/styles.css` at the
 * package root — `stylesheet` is resolved relative to the config file that
 * spreads this, not to this file.
 */
export const oxfmtConfigReact = {
  ...oxfmtConfigBase,
  ignorePatterns: oxfmtIgnorePatterns,
  sortTailwindcss: {
    functions: ['clsx', 'cn', 'cva'],
    stylesheet: './src/styles.css',
  },
  overrides: [
    ...oxfmtConfigBase.overrides,
    {
      // The Vite entrypoints carry no classes, and resolving the stylesheet for
      // them would require the workspace to be built first.
      files: ['index.html'],
      options: { sortTailwindcss: false },
    },
  ],
};
