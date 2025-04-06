import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';

import {
  projectScope,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { fastifyServerProvider } from '../fastify-server/index.js';

const descriptorSchema = z.object({});

export interface FastifyHealthCheckProvider {
  addCheck(check: TypescriptCodeBlock): void;
}

export const fastifyHealthCheckProvider =
  createProviderType<FastifyHealthCheckProvider>('fastify-health-check');

// async () => ({ success: true })

export const fastifyHealthCheckGenerator = createGenerator({
  name: 'core/fastify-health-check',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        fastifyServer: fastifyServerProvider,
        typescript: typescriptProvider,
      },
      exports: {
        fastifyHealthCheck: fastifyHealthCheckProvider.export(projectScope),
      },
      run({ fastifyServer, typescript }) {
        fastifyServer.registerPlugin({
          name: 'healthCheckPlugin',
          plugin: new TypescriptCodeExpression(
            'healthCheckPlugin',
            "import { healthCheckPlugin } from '@/src/plugins/health-check.js'",
          ),
        });

        const checks: TypescriptCodeBlock[] = [];

        return {
          providers: {
            fastifyHealthCheck: {
              addCheck(check) {
                checks.push(check);
              },
            },
          },
          build: async (builder) => {
            const healthCheckPlugin = typescript.createTemplate({
              CHECK: { type: 'code-expression' },
            });

            if (checks.length > 0) {
              const checksBlock = TypescriptCodeUtils.mergeBlocks(
                checks,
                '\n\n',
              );
              healthCheckPlugin.addCodeExpression(
                'CHECK',
                checksBlock.wrapAsExpression((content) =>
                  `async () => {
              ${content}

              return { success: true }
            }
            `.trim(),
                ),
              );
            } else {
              healthCheckPlugin.addCodeExpression(
                'CHECK',
                new TypescriptCodeExpression('async () => ({ success: true })'),
              );
            }

            await builder.apply(
              healthCheckPlugin.renderToAction(
                'health-check.ts',
                'src/plugins/health-check.ts',
              ),
            );
          },
        };
      },
    }),
  }),
});
