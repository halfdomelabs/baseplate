import {
  eslintProvider,
  nodeProvider,
  projectScope,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGenerator,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { fastifyOutputProvider } from '../fastify/index.js';

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
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
        eslint: eslintProvider,
      },
      exports: {
        fastifyScripts: fastifyScriptsProvider.export(projectScope),
      },
      run({ node, fastifyOutput, eslint }) {
        eslint
          .getConfig()
          .appendUnique('extraTsconfigProjects', ['./scripts/tsconfig.json']);
        node.addScripts({
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
              copyFileAction({
                source: 'tsconfig.tpl.json',
                destination: 'scripts/tsconfig.json',
              }),
            );
          },
        };
      },
    });
  },
});
