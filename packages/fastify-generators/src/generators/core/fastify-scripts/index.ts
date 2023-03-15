import { eslintProvider, nodeProvider } from '@baseplate/core-generators';
import {
  copyFileAction,
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { z } from 'zod';
import { fastifyOutputProvider } from '../fastify';

const descriptorSchema = z.object({});

export interface FastifyScriptsProvider {
  getScriptDirectory(): string;
}

export const fastifyScriptsProvider =
  createProviderType<FastifyScriptsProvider>('fastify-scripts');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    node: nodeProvider,
    fastifyOutput: fastifyOutputProvider,
    eslint: eslintProvider,
  },
  exports: {
    fastifyScripts: fastifyScriptsProvider,
  },
  run({ node, fastifyOutput, eslint }) {
    eslint
      .getConfig()
      .appendUnique('extraTsconfigProjects', ['./scripts/tsconfig.json']);
    node.addScripts({
      'run:script': `ts-node --transpile-only ${fastifyOutput.getDevLoaderString()}`,
      'dev:script': `ts-node-dev --rs --transpile-only --respawn ${fastifyOutput.getDevLoaderString()}`,
    });
    return {
      getProviders: () => ({
        fastifyScripts: {
          getScriptDirectory() {
            return 'scripts';
          },
        },
      }),
      build: async (builder) => {
        await builder.apply(
          copyFileAction({
            source: 'tsconfig.tpl.json',
            destination: 'scripts/tsconfig.json',
          })
        );
      },
    };
  },
}));

const FastifyScriptsGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default FastifyScriptsGenerator;
