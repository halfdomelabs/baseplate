import {
  createGeneratorWithChildren,
  createProviderType,
  writeFormattedAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  additionalExclusions: z.array(z.string().min(1)).optional(),
});

export type NodeGitIgnoreProvider = {
  addExclusions(exclusions: string[]): void;
};

export const nodeGitIgnoreProvider =
  createProviderType<NodeGitIgnoreProvider>('node-git-ignore');

const NodeGitIgnoreGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {},
  exports: {
    nodeGitIgnore: nodeGitIgnoreProvider,
  },
  createGenerator(descriptor) {
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
      '# Baseplate temporary and log files',
      'baseplate/.clean_tmp',
      'baseplate/.build_result.json',
    ];
    return {
      getProviders: () => ({
        nodeGitIgnore: {
          addExclusions(exclusions: string[]) {
            exclusionLines.push('');
            exclusionLines.push(...exclusions);
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
          })
        );
      },
    };
  },
});

export default NodeGitIgnoreGenerator;
