import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { CORE_PACKAGES } from '#src/constants/index.js';
import { packageScope } from '#src/providers/scopes.js';
import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '#src/renderers/index.js';
import { extractPackageVersions } from '#src/utils/extract-packages.js';

import { eslintConfigProvider } from '../eslint/index.js';
import { createNodePackagesTask, createNodeTask } from '../node/index.js';
import { NODE_VITEST_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  includeTestHelpers: z.boolean().default(true),
});

/**
 * Renders a number the way `unicorn/numeric-separators-style` wants it, since
 * the generated config is linted by the consuming app's own stricter config.
 *
 * The rule enforces its five-digit threshold in both directions, so `1_000` is
 * as much an error as `15000`.
 *
 * @param value Number to render.
 * @returns The literal, underscore-grouped only from five digits up.
 */
function renderNumericLiteral(value: number): string {
  const literal = String(value);
  return literal.length < 5
    ? literal
    : literal.replaceAll(/\B(?=(\d{3})+(?!\d))/g, '_');
}

const [setupTask, vitestConfigProvider, vitestConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      globalSetupFiles: t.array<string>(),
      setupFiles: t.array<string>(),
      maxWorkers: t.number(),
      testTimeout: t.number(),
      environment: t.scalar<'jsdom' | 'happy-dom'>(),
    }),
    {
      prefix: 'vitest',
      configScope: packageScope,
    },
  );

export { vitestConfigProvider };

export const vitestGenerator = createGenerator({
  name: 'node/vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ includeTestHelpers }) => ({
    paths: NODE_VITEST_GENERATED.paths.task,
    renderers: NODE_VITEST_GENERATED.renderers.task,
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(CORE_PACKAGES, ['vitest', 'vite']),
    }),
    setup: setupTask,
    node: createNodeTask((node) => {
      node.scripts.mergeObj({
        test: 'vitest run',
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: NODE_VITEST_GENERATED.renderers.provider,
        eslintConfig: eslintConfigProvider,
        vitestConfigValues: vitestConfigValuesProvider,
      },
      run({
        eslintConfig,
        vitestConfigValues: {
          globalSetupFiles,
          setupFiles,
          maxWorkers,
          testTimeout,
          environment,
        },
        renderers,
      }) {
        eslintConfig.enableVitest.set(true);

        return {
          build: async (builder) => {
            const configValues = TsCodeUtils.mergeFragmentsAsObject({
              clearMocks: 'true',
              passWithNoTests: 'true',
              globalSetup:
                globalSetupFiles.length > 0
                  ? JSON.stringify(globalSetupFiles.toSorted())
                  : undefined,
              setupFiles:
                setupFiles.length > 0
                  ? JSON.stringify(setupFiles.toSorted())
                  : undefined,
              dir: quot('src'),
              env: tsCodeFragment(
                "loadEnv('development', process.cwd(), '')",
                tsImportBuilder(['loadEnv']).from('vite'),
              ),
              environment:
                environment === undefined ? undefined : quot(environment),
              // TEST_MODE=unit runs have no DB involvement and keep full parallelism.
              maxWorkers:
                maxWorkers === undefined
                  ? undefined
                  : tsCodeFragment(
                      `process.env.TEST_MODE === 'unit' ? undefined : ${renderNumericLiteral(maxWorkers)}`,
                    ),
              testTimeout:
                testTimeout === undefined
                  ? undefined
                  : renderNumericLiteral(testTimeout),
            });

            await builder.apply(
              renderers.vitestConfig.render({
                variables: {
                  TPL_CONFIG: TsCodeUtils.mergeFragmentsAsObject({
                    resolve: JSON.stringify({
                      tsconfigPaths: true,
                    }),
                    test: configValues,
                  }),
                },
              }),
            );
            if (includeTestHelpers) {
              await builder.apply(renderers.testHelpersGroup.render({}));
            }
          },
        };
      },
    }),
  }),
});
