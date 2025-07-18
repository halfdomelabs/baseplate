// @ts-nocheck

import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
  writeFormattedAction,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { packageScope } from '#src/providers/scopes.js';

const descriptorSchema = z.object({
  additionalExclusions: z.array(z.string().min(1)).optional(),
});

export interface NodeGitIgnoreProvider {
  addExclusions(exclusions: string[]): void;
}

export const nodeGitIgnoreProvider =
  createProviderType<NodeGitIgnoreProvider>('node-git-ignore');

export const nodeGitIgnoreGenerator = createGenerator({
  name: 'node/node-git-ignore',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(CORE_PACKAGES, [
        'vitest',
        'vite-tsconfig-paths',
      ]),
    }),
    mainTask: createGeneratorTask({
      dependencies: {},
      exports: {
        nodeGitIgnore: nodeGitIgnoreProvider.export(packageScope),
      },
      run() {
        const exclusionLines: string[] = [
          '# See https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository#_ignoring for more about ignoring files.',
          '',
          '# Dependency directories',
          'node_modules/',
          'jspm_packages/',
          '/.pnp',
          '',
          '# Logs',
          '*.log',
          'npm-debug.log*',
          'yarn-debug.log*',
          'yarn-error.log*',
          '.pnpm-debug.log*',
          '',
          '# Diagnostic reports (https://nodejs.org/api/report.html)',
          'report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json',
          '',
          '# TypeScript cache',
          '*.tsbuildinfo',
          '',
          '# Optional npm cache directory',
          '.npm',
          '',
          '# Optional eslint cache',
          '.eslintcache',
          '',
          '# Baseplate build artifacts',
          'baseplate/build',
        ];
        return {
          providers: {
            nodeGitIgnore: {
              addExclusions(exclusions: string[]) {
                exclusionLines.push('', ...exclusions);
              },
            },
          },
          build: async (builder) => {
            if (descriptor.additionalExclusions) {
              exclusionLines.push(...descriptor.additionalExclusions);
            }
            await builder.apply(
              writeFormattedAction({
                destination: '.gitignore',
                contents: `${exclusionLines.join('\n')}\n`,
              }),
            );
          },
        };
      },
    }),
  }),
});
