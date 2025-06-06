import { nodeProvider, projectScope } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
  renderRawTemplateFileAction,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { fastifyOutputProvider } from '../fastify/fastify.generator.js';
import { CORE_FASTIFY_SCRIPTS_RAW_TEMPLATES } from './generated/raw-templates.js';

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
    main: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
      },
      exports: {
        fastifyScripts: fastifyScriptsProvider.export(projectScope),
      },
      run({ node, fastifyOutput }) {
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
                template: CORE_FASTIFY_SCRIPTS_RAW_TEMPLATES.tsconfig,
                destination: 'scripts/tsconfig.json',
              }),
            );
          },
        };
      },
    }),
  }),
});
