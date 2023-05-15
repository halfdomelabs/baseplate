import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { fastifyServerProvider } from '../fastify-server';

const descriptorSchema = z.object({});

export interface FastifyHealthCheckProvider {
  addCheck(check: TypescriptCodeBlock): void;
}

export const fastifyHealthCheckProvider =
  createProviderType<FastifyHealthCheckProvider>('fastify-health-check');

// async () => ({ success: true })

const FastifyHealthCheckGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    fastifyServer: fastifyServerProvider,
    typescript: typescriptProvider,
  },
  exports: {
    fastifyHealthCheck: fastifyHealthCheckProvider,
  },
  createGenerator(descriptor, { fastifyServer, typescript }) {
    fastifyServer.registerPlugin({
      name: 'healthCheckPlugin',
      plugin: new TypescriptCodeExpression(
        'healthCheckPlugin',
        "import { healthCheckPlugin } from '@/src/plugins/health-check'"
      ),
    });

    const checks: TypescriptCodeBlock[] = [];

    return {
      getProviders: () => ({
        fastifyHealthCheck: {
          addCheck(check) {
            checks.push(check);
          },
        },
      }),
      build: async (builder) => {
        const healthCheckPlugin = typescript.createTemplate({
          CHECK: { type: 'code-expression' },
        });

        if (checks.length) {
          const checksBlock = TypescriptCodeUtils.mergeBlocks(checks, '\n\n');
          healthCheckPlugin.addCodeExpression(
            'CHECK',
            checksBlock.wrapAsExpression((content) =>
              `async () => {
              ${content}

              return { success: true }
            }
            `.trim()
            )
          );
        } else {
          healthCheckPlugin.addCodeExpression(
            'CHECK',
            new TypescriptCodeExpression('async () => ({ success: true })')
          );
        }

        await builder.apply(
          healthCheckPlugin.renderToAction(
            'health-check.ts',
            'src/plugins/health-check.ts'
          )
        );
      },
    };
  },
});

export default FastifyHealthCheckGenerator;
