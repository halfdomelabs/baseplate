/** @typedef {import('oxfmt').OxfmtConfig} OxfmtConfig */

// Nested oxfmt configs replace the root config rather than merging with it, so
// consumers must spread both the base options and these ignore patterns.

/** @type {string[]} */
export const oxfmtIgnorePatterns = [
  '**/dist/**',
  '**/node_modules/**',
  '**/build/**',
  '**/coverage/**',
  '**/logs/**',
  '**/temp/**',
  '**/tmp/**',
  '**/generated/prisma/**',
  '**/.env*',
  '**/LICENSE',
  'pnpm-lock.yaml',
];

export const oxfmtConfigBase = {
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  printWidth: 80,
  sortImports: {
    internalPattern: ['@src/', '#'],
    ignoreCase: true,
    // We use the default groups but ensure we place the side-effect imports last except for instrumentation
    groups: [
      'type-import',
      ['value-builtin', 'value-external'],
      'type-internal',
      'value-internal',
      ['type-parent', 'type-sibling', 'type-index'],
      ['value-parent', 'value-sibling', 'value-index'],
      'side_effect',
      'unknown',
    ],
  },
  sortPackageJson: true,
  // we don't want trailing commas in jsonc files (https://github.com/prettier/prettier/issues/15956)
  overrides: [
    {
      files: ['**/*.jsonc'],
      options: { trailingComma: 'none' },
    },
  ],
};
