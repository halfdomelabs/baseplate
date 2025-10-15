import type { InferFieldMapSchemaFromBuilder } from '@baseplate-dev/utils';

import {
  createNodeTask,
  extractPackageVersions,
  nodeConfigProvider,
  nodeGitIgnoreProvider,
  nodeProvider,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createConfigFieldMap,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  createProviderType,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { createFieldMapSchemaBuilder } from '@baseplate-dev/utils';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import { fastifyTypescriptTask } from './setup-fastify-typescript.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type FastifyNodeFlagUseCase = 'dev-env' | 'instrument';

export interface FastifyNodeFlag {
  flag: string;
  /**
   * The type of flag that is used
   *
   * 'dev-env': For setting up environment variables in dev
   * 'instrument': For instrumenting the code
   */
  useCase: FastifyNodeFlagUseCase;
  targetEnvironment: 'dev' | 'prod';
}

export interface FastifyGeneratorConfig {
  /**
   * Command to pipe the dev output into, e.g. pino-pretty
   */
  devOutputFormatter?: string;
  nodeFlags: FastifyNodeFlag[];
}

const fastifyConfigSchema = createFieldMapSchemaBuilder((t) => ({
  /**
   * Command to pipe the dev output into, e.g. pino-pretty
   */
  devOutputFormatter: t.scalar<string>(),
  /**
   * Flags to pass to the node command when running
   */
  nodeFlags: t.map<string, FastifyNodeFlag>(),
  /**
   * Whether the dev command should run dev:* scripts in parallel. For example,
   * if you have a dev:workers script, enable this flag so that it will be run
   * when the user runs pnpm dev.
   *
   * Otherwise, the dev command will only run the server script.
   */
  enableParallelDevCommand: t.scalar<boolean>(),
}));

export type FastifyProvider = InferFieldMapSchemaFromBuilder<
  typeof fastifyConfigSchema
>;

export const fastifyProvider = createProviderType<FastifyProvider>('fastify');

export interface FastifyOutputProvider {
  getNodeFlags(): FastifyNodeFlag[];
  getNodeFlagsDev(useCase?: FastifyNodeFlagUseCase): string[];
  getNodeFlagsProd(useCase?: FastifyNodeFlagUseCase): string[];
  getDevOutputFormatter(): string | undefined;
  getNodeCommand(
    script: string,
    targetEnvironment: 'dev' | 'prod',
    options?: { executable?: string },
  ): string;
}

export const fastifyOutputProvider =
  createReadOnlyProviderType<FastifyOutputProvider>('fastify-output');

export const fastifyGenerator = createGenerator({
  name: 'core/fastify',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodeSetup: createGeneratorTask({
      dependencies: {
        nodeConfig: nodeConfigProvider,
      },
      run({ nodeConfig }) {
        nodeConfig.isEsm.set(true);
        return {};
      },
    }),
    fastifyTypescript: fastifyTypescriptTask,
    node: createNodeTask((node) => {
      node.packages.addDevPackages(
        extractPackageVersions(FASTIFY_PACKAGES, [
          'tsc-alias',
          'tsx',
          '@types/node',
        ]),
      );
      node.extraProperties.merge({
        main: 'dist/index.js',
        files: ['dist/**/*', 'package.json', 'README.md'],
      });
    }),
    gitIgnore: createProviderTask(nodeGitIgnoreProvider, (nodeGitIgnore) => {
      nodeGitIgnore.exclusions.set('fastify', ['/dist']);
    }),
    main: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
      },
      exports: {
        fastify: fastifyProvider.export(packageScope),
      },
      outputs: {
        fastifyOutput: fastifyOutputProvider.export(packageScope),
      },
      run({ node }) {
        const fastifyConfig = createConfigFieldMap(fastifyConfigSchema);

        return {
          providers: {
            fastify: fastifyConfig,
          },
          build() {
            // add scripts
            const { devOutputFormatter, nodeFlags, enableParallelDevCommand } =
              fastifyConfig.getValues();

            const USE_CASE_ORDER: Record<FastifyNodeFlagUseCase, number> = {
              'dev-env': 0,
              instrument: 1,
            };

            const sortedNodeFlags = sortBy(
              [...nodeFlags.entries()],
              // Sort by use case, then by name
              [([, flag]) => USE_CASE_ORDER[flag.useCase], ([name]) => name],
            ).map(([, flag]) => flag);

            function getNodeCommand(
              script: string,
              targetEnvironment: 'dev' | 'prod',
              {
                executable: executableOverride,
              }: {
                executable?: string;
              } = {},
            ): string {
              const executable =
                executableOverride ??
                (targetEnvironment === 'prod'
                  ? 'node'
                  : 'tsx watch --clear-screen=false');
              const outputFormatter =
                devOutputFormatter && targetEnvironment === 'dev'
                  ? `| ${devOutputFormatter}`
                  : '';

              return [
                executable,
                ...sortedNodeFlags
                  .filter((f) => f.targetEnvironment === targetEnvironment)
                  .map((f) => f.flag),
                script,
                outputFormatter,
              ]
                .filter(Boolean)
                .join(' ');
            }
            const devCommand = getNodeCommand('src/index.ts', 'dev');
            const startCommand = getNodeCommand('dist/index.js', 'prod');

            node.scripts.mergeObj({
              build: 'tsc && tsc-alias',
              start: startCommand,
            });

            if (enableParallelDevCommand) {
              node.scripts.set(
                'dev',
                'FORCE_COLOR=1 pnpm run --reporter-hide-prefix --parallel "/^dev:/"',
              );
              node.scripts.set('dev:server', devCommand);
            } else {
              node.scripts.set('dev', devCommand);
            }

            return {
              fastifyOutput: {
                getNodeFlags: () => sortedNodeFlags,
                getNodeFlagsDev: (useCase) =>
                  sortedNodeFlags
                    .filter(
                      (f) =>
                        f.targetEnvironment === 'dev' &&
                        (!useCase || f.useCase === useCase),
                    )
                    .map((f) => f.flag),
                getNodeFlagsProd: (useCase) =>
                  sortedNodeFlags
                    .filter(
                      (f) =>
                        f.targetEnvironment === 'prod' &&
                        (!useCase || f.useCase === useCase),
                    )
                    .map((f) => f.flag),
                getDevOutputFormatter: () => devOutputFormatter,
                getNodeCommand,
              },
            };
          },
        };
      },
    }),
  }),
});
