import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  createNodeTask,
  extractPackageVersions,
  nodeConfigProvider,
  nodeGitIgnoreProvider,
  nodeProvider,
  projectScope,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createOutputProviderType,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { fastifyTypescriptTask } from './setup-fastify-typescript.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

type NodeFlagUseCase = 'dev-env' | 'instrument';

interface NodeFlag {
  flag: string;
  /**
   * The type of flag that is used
   *
   * 'dev-env': For setting up environment variables in dev
   * 'instrument': For instrumenting the code
   */
  useCase: NodeFlagUseCase;
  targetEnvironment: 'dev' | 'prod';
}

export interface FastifyGeneratorConfig {
  /**
   * Command to pipe the dev output into, e.g. pino-pretty
   */
  devOutputFormatter?: string;
  nodeFlags: NodeFlag[];
}

export interface FastifyProvider {
  getConfig: () => NonOverwriteableMap<FastifyGeneratorConfig>;
}

export const fastifyProvider = createProviderType<FastifyProvider>('fastify');

export interface FastifyOutputProvider {
  getNodeFlags(): NodeFlag[];
  getNodeFlagsDev(useCase?: NodeFlagUseCase): string[];
  getNodeFlagsProd(useCase?: NodeFlagUseCase): string[];
  getDevOutputFormatter(): string | undefined;
}

export const fastifyOutputProvider =
  createOutputProviderType<FastifyOutputProvider>('fastify-output');

export const fastifyGenerator = createGenerator({
  name: 'core/fastify',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask({
      name: 'node-setup',
      dependencies: {
        nodeConfig: nodeConfigProvider,
      },
      run({ nodeConfig }, { taskId }) {
        nodeConfig.isEsm.set(false, taskId);
        return {};
      },
    }),
    fastifyTypescriptTask,
    createNodeTask((node, { taskId }) => {
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
    createGeneratorTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        nodeGitIgnore: nodeGitIgnoreProvider,
      },
      exports: {
        fastify: fastifyProvider.export(projectScope),
      },
      outputs: {
        fastifyOutput: fastifyOutputProvider.export(projectScope),
      },
      run({ node, nodeGitIgnore }, { taskId }) {
        const config = createNonOverwriteableMap<FastifyGeneratorConfig>(
          { nodeFlags: [] },
          { name: 'fastify-config', mergeArraysUniquely: true },
        );

        nodeGitIgnore.addExclusions(['/dist']);

        return {
          providers: {
            fastify: {
              getConfig: () => config,
            },
          },
          build() {
            // add scripts
            const { devOutputFormatter, nodeFlags } = config.value();

            const outputFormatter = devOutputFormatter
              ? `| ${devOutputFormatter}`
              : '';
            const devCommand = [
              'tsx watch --clear-screen=false',
              ...nodeFlags
                .filter((f) => f.targetEnvironment === 'dev')
                .map((f) => f.flag),
              'src/index.ts',
              outputFormatter,
            ]
              .filter(Boolean)
              .join(' ');
            const startCommand = [
              'node',
              ...nodeFlags
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
                getNodeFlags: () => nodeFlags,
                getNodeFlagsDev: (useCase) =>
                  nodeFlags
                    .filter(
                      (f) =>
                        f.targetEnvironment === 'dev' &&
                        (!useCase || f.useCase === useCase),
                    )
                    .map((f) => f.flag),
                getNodeFlagsProd: (useCase) =>
                  nodeFlags
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
  ],
});
