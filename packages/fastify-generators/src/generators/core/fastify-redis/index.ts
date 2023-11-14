import {
  ImportMap,
  ImportMapper,
  jestProvider,
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { configServiceProvider } from '../config-service/index.js';
import { fastifyHealthCheckProvider } from '../fastify-health-check/index.js';

const descriptorSchema = z.object({
  defaultUrl: z.string().min(1),
});

type Descriptor = z.infer<typeof descriptorSchema>;

export type FastifyRedisProvider = ImportMapper;

export const fastifyRedisProvider = createProviderType<FastifyRedisProvider>(
  'fastify-redis',
  { isReadOnly: true },
);

const createMainTask = createTaskConfigBuilder(
  ({ defaultUrl }: Descriptor) => ({
    name: 'main',
    dependencies: {
      node: nodeProvider,
      configService: configServiceProvider,
      fastifyHealthCheck: fastifyHealthCheckProvider,
      typescript: typescriptProvider,
      jest: jestProvider.dependency().optional(),
    },
    exports: {
      fastifyRedis: fastifyRedisProvider,
    },
    run({ node, configService, fastifyHealthCheck, typescript, jest }) {
      node.addPackages({ ioredis: '5.3.2' });
      node.addDevPackages({ 'ioredis-mock': '8.7.0' });

      const [redisImport, redisPath] = makeImportAndFilePath(
        `src/services/redis.ts`,
      );

      const importMap: ImportMap = {
        '%fastify-redis': {
          path: redisImport,
          allowedImports: ['getRedisClient', 'createRedisClient'],
        },
      };

      configService.getConfigEntries().set('REDIS_URL', {
        comment: 'Connection URL of Redis',
        value: TypescriptCodeUtils.createExpression('z.string().min(1)'),
        exampleValue: defaultUrl,
      });
      fastifyHealthCheck.addCheck(
        TypescriptCodeUtils.createBlock(
          `// check Redis is operating
          const redisClient = getRedisClient();
          await redisClient.ping();`,
          "import { getRedisClient } from '%fastify-redis'",
          { importMappers: [{ getImportMap: () => importMap }] },
        ),
      );

      return {
        getProviders: () => ({
          fastifyRedis: {
            getImportMap: () => ({
              '%fastify-redis': {
                path: redisImport,
                allowedImports: ['getRedisClient', 'createRedisClient'],
              },
            }),
          },
        }),
        build: async (builder) => {
          const redisFile = typescript.createTemplate({
            CONFIG: configService.getConfigExpression(),
          });
          await builder.apply(redisFile.renderToAction('redis.ts', redisPath));

          if (jest) {
            await builder.apply(
              typescript.createCopyAction({
                source: 'mock-redis.ts',
                destination: 'src/tests/scripts/mock-redis.ts',
              }),
            );
            jest
              .getConfig()
              .appendUnique('setupFilesAfterEnv', [
                './src/tests/scripts/mock-redis.ts',
              ]);
          }
        },
      };
    },
  }),
);

const FastifyRedisGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default FastifyRedisGenerator;
