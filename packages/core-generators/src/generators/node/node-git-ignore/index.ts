import {
  createGeneratorWithTasks,
  createProviderType,
  writeFormattedAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { projectScope } from '@src/providers/scopes.js';

const descriptorSchema = z.object({
  additionalExclusions: z.array(z.string().min(1)).optional(),
});

export interface NodeGitIgnoreProvider {
  addExclusions(exclusions: string[]): void;
}

export const nodeGitIgnoreProvider =
  createProviderType<NodeGitIgnoreProvider>('node-git-ignore');

const NodeGitIgnoreGenerator = createGeneratorWithTasks({
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {},
      exports: {
        nodeGitIgnore: nodeGitIgnoreProvider.export(projectScope),
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
          getProviders: () => ({
            nodeGitIgnore: {
              addExclusions(exclusions: string[]) {
                exclusionLines.push('', ...exclusions);
              },
            },
          }),
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
    });
  },
});

export default NodeGitIgnoreGenerator;
