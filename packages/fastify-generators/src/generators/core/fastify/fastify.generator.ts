import type { InferFieldMapSchemaFromBuilder } from '@halfdomelabs/utils';

import {
  createNodeTask,
  extractPackageVersions,
  nodeConfigProvider,
  nodeGitIgnoreProvider,
  nodeProvider,
  projectScope,
} from '@halfdomelabs/core-generators';
import {
  createConfigFieldMap,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  createProviderType,
  createReadOnlyProviderType,
} from '@halfdomelabs/sync';
import { createFieldMapSchemaBuilder } from '@halfdomelabs/utils';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

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
        nodeConfig.isEsm.set(false);
        return {};
      },
    }),
    fastifyTypescript: fastifyTypescriptTask,
    node: createNodeTask((node, { taskId }) => {
      node.packages.addDevPackages(
        extractPackageVersions(FASTIFY_PACKAGES, [
          'tsc-alias',
          'tsx',
          '@types/node',
        ]),
      );
      node.extraProperties.merge(
        {
          main: 'dist/index.js',
          files: ['dist/**/*', 'package.json', 'README.md'],
        },
        taskId,
      );
    }),
    gitIgnore: createProviderTask(nodeGitIgnoreProvider, (nodeGitIgnore) => {
      nodeGitIgnore.addExclusions(['/dist']);
    }),
    main: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
      },
      exports: {
        fastify: fastifyProvider.export(projectScope),
      },
      outputs: {
        fastifyOutput: fastifyOutputProvider.export(projectScope),
      },
      run({ node }, { taskId }) {
        const fastifyConfig = createConfigFieldMap(fastifyConfigSchema);

        return {
          providers: {
            fastify: fastifyConfig,
          },
          build() {
            // add scripts
            const { devOutputFormatter, nodeFlags } = fastifyConfig.getValues();

            const USE_CASE_ORDER: Record<FastifyNodeFlagUseCase, number> = {
              'dev-env': 0,
              instrument: 1,
            };

            const sortedNodeFlags = sortBy(
              [...nodeFlags.entries()],
              // Sort by use case, then by name
              [([, flag]) => USE_CASE_ORDER[flag.useCase], ([name]) => name],
            ).map(([, flag]) => flag);

            const outputFormatter = devOutputFormatter
              ? `| ${devOutputFormatter}`
              : '';
            const devCommand = [
              'tsx watch --clear-screen=false',
              ...sortedNodeFlags
                .filter((f) => f.targetEnvironment === 'dev')
                .map((f) => f.flag),
              'src/index.ts',
              outputFormatter,
            ]
              .filter(Boolean)
              .join(' ');
            const startCommand = [
              'node',
              ...sortedNodeFlags
                .filter((f) => f.targetEnvironment === 'prod')
                .map((f) => f.flag),
              'dist/index.js',
            ].join(' ');

            node.scripts.mergeObj(
              {
                build: 'tsc && tsc-alias',
                start: startCommand,
                dev: devCommand,
              },
              taskId,
            );

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
              },
            };
          },
        };
      },
    }),
  }),
});
