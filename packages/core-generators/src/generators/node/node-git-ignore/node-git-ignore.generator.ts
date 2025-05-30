import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { projectScope } from '#src/providers/scopes.js';

const descriptorSchema = z.object({
  additionalExclusions: z.array(z.string().min(1)).optional(),
});

const [setupTask, nodeGitIgnoreProvider, nodeGitIgnoreConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      exclusions: t.map<string, string[]>(),
    }),
    {
      prefix: 'node-git-ignore',
      configScope: projectScope,
    },
  );

export { nodeGitIgnoreProvider };

export const nodeGitIgnoreGenerator = createGenerator({
  name: 'node/node-git-ignore',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        nodeGitIgnoreConfigValues: nodeGitIgnoreConfigValuesProvider,
      },
      run({ nodeGitIgnoreConfigValues: { exclusions } }) {
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
        if (exclusions.size > 0) {
          const sortedExclusions = [...exclusions.entries()].sort((a, b) =>
            a[0].localeCompare(b[0]),
          );
          exclusionLines.push(
            ...sortedExclusions.flatMap(([, value]) => ['', ...value]),
          );
        }
        return {
          build: (builder) => {
            if (descriptor.additionalExclusions) {
              exclusionLines.push('', ...descriptor.additionalExclusions);
            }
            builder.writeFile({
              id: 'gitignore',
              destination: '.gitignore',
              contents: `${exclusionLines.join('\n')}\n`,
            });
          },
        };
      },
    }),
  }),
});
