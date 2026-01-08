import { nodeProvider, packageScope } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
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
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
      },
      exports: {
        fastifyScripts: fastifyScriptsProvider.export(packageScope),
      },
      run({ node, fastifyOutput }) {
        node.scripts.mergeObj({
          'script:run': ['tsx', ...fastifyOutput.getNodeFlagsDev()].join(' '),
          'script:dev': [
            `tsx watch --respawn`,
            ...fastifyOutput.getNodeFlagsDev(),
          ].join(' '),
        });
        return {
          providers: {
            fastifyScripts: {
              getScriptDirectory() {
                return 'src/scripts';
              },
            },
          },
        };
      },
    }),
  }),
});
