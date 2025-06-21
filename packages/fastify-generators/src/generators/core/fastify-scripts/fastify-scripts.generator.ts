import {
  nodeProvider,
  packageScope,
  renderRawTemplateFileAction,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { fastifyOutputProvider } from '../fastify/index.js';
import { CORE_FASTIFY_SCRIPTS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export interface FastifyScriptsProvider {
  getScriptDirectory(): string;
}

export const fastifyScriptsProvider =
  createProviderType<FastifyScriptsProvider>('fastify-scripts');

export const fastifyScriptsGenerator = createGenerator({
  name: 'core/fastify-scripts',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_FASTIFY_SCRIPTS_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
        paths: CORE_FASTIFY_SCRIPTS_GENERATED.paths.provider,
      },
      exports: {
        fastifyScripts: fastifyScriptsProvider.export(packageScope),
      },
      run({ node, fastifyOutput, paths }) {
        node.scripts.mergeObj({
          'run:script': ['tsx', ...fastifyOutput.getNodeFlagsDev()].join(' '),
          'dev:script': [
            `tsx watch --respawn`,
            ...fastifyOutput.getNodeFlagsDev(),
          ].join(' '),
        });
        return {
          providers: {
            fastifyScripts: {
              getScriptDirectory() {
                return 'scripts';
              },
            },
          },
          build: async (builder) => {
            await builder.apply(
              renderRawTemplateFileAction({
                template: CORE_FASTIFY_SCRIPTS_GENERATED.templates.tsconfig,
                destination: paths.tsconfig,
              }),
            );
          },
        };
      },
    }),
  }),
});
