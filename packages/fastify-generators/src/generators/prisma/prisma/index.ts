import {
  copyTypescriptFileAction,
  nodeProvider,
  projectProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { formatSchema } from '@prisma/sdk';
import * as yup from 'yup';
import { configServiceProvider } from '@src/generators/core/config-service';
import { fastifyHealthCheckProvider } from '@src/generators/core/fastify-health-check';
import { PrismaOutputModel } from '@src/types/prismaOutput';
import { PrismaModelBlockWriter } from '@src/writers/prisma-schema';
import {
  createPrismaSchemaDatasourceBlock,
  createPrismaSchemaGeneratorBlock,
  PrismaSchemaFile,
} from '@src/writers/prisma-schema/schema';

const descriptorSchema = yup.object({
  defaultPort: yup.string().default('5432'),
  defaultDatabaseUrl: yup.string(),
});

export interface PrismaSchemaProvider {
  addPrismaModel(model: PrismaModelBlockWriter): void;
}

export const prismaSchemaProvider =
  createProviderType<PrismaSchemaProvider>('prisma-schema');

export interface PrismaOutputProvider {
  getPrismaClient(): TypescriptCodeExpression;
  getPrismaModel(model: string): PrismaOutputModel;
  getPrismaModelExpression(model: string): TypescriptCodeExpression;
  getModelTypeExpression(model: string): TypescriptCodeExpression;
}

export const prismaOutputProvider =
  createProviderType<PrismaOutputProvider>('prisma-output');

const PrismaGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    configService: configServiceProvider,
    project: projectProvider,
    fastifyHealthCheck: fastifyHealthCheckProvider,
  },
  exports: {
    prismaSchema: prismaSchemaProvider,
    prismaOutput: prismaOutputProvider.export().dependsOn(prismaSchemaProvider),
  },
  createGenerator(
    descriptor,
    { node, configService, project, fastifyHealthCheck }
  ) {
    node.addDevPackages({
      prisma: '^3.9.2',
    });

    node.addPackages({
      '@prisma/client': '3.9.2',
    });

    const schemaFile = new PrismaSchemaFile();

    schemaFile.addGeneratorBlock(
      createPrismaSchemaGeneratorBlock({
        name: 'client',
        provider: 'prisma-client-js',
      })
    );

    schemaFile.setDatasourceBlock(
      createPrismaSchemaDatasourceBlock({
        name: 'db',
        provider: 'postgresql',
        url: 'env("DATABASE_URL")',
      })
    );

    const defaultDatabaseUrl =
      descriptor.defaultDatabaseUrl ||
      `postgres://postgres:${project.getProjectName()}-password@localhost:${
        descriptor.defaultPort
      }/postgres?schema=public`;

    configService.getConfigEntries().set('DATABASE_URL', {
      comment: 'Connection URL of the database',
      value: TypescriptCodeUtils.createExpression('yup.string().required()'),
      exampleValue: defaultDatabaseUrl,
    });

    fastifyHealthCheck.addCheck(
      TypescriptCodeUtils.createBlock(
        '// check Prisma is operating\nawait prisma.$queryRaw`SELECT 1;`;',
        "import { prisma } from '@/src/services/prisma'"
      )
    );

    return {
      getProviders: () => ({
        prismaSchema: {
          addPrismaModel: (model) => {
            schemaFile.addModelWriter(model);
          },
        },
        prismaOutput: {
          getPrismaClient: () =>
            TypescriptCodeUtils.createExpression(
              'prisma',
              "import { prisma } from '@/src/services/prisma'"
            ),
          getPrismaModel: (modelName) => {
            const modelBlock = schemaFile.getModelBlock(modelName);
            if (!modelBlock) {
              throw new Error(`Model ${modelName} not found`);
            }
            return modelBlock;
          },
          getPrismaModelExpression: (modelName) => {
            const modelExport =
              modelName.charAt(0).toLocaleLowerCase() + modelName.slice(1);
            return TypescriptCodeUtils.createExpression(
              `prisma.${modelExport}`,
              "import { prisma } from '@/src/services/prisma'"
            );
          },
          getModelTypeExpression: (modelName) =>
            TypescriptCodeUtils.createExpression(
              modelName,
              `import { ${modelName} } from '@prisma/client'`
            ),
        },
      }),
      build: async (builder) => {
        const schemaText = schemaFile.toText();
        const formattedSchemaText = (await formatSchema({
          schema: schemaText,
        })) as string;
        builder.writeFile('prisma/schema.prisma', formattedSchemaText);

        builder.addPostWriteCommand('yarn prisma generate', {
          onlyIfChanged: ['prisma/schema.prisma'],
        });

        await builder.apply(
          copyTypescriptFileAction({
            source: 'services/prisma.ts',
            destination: 'src/services/prisma.ts',
          })
        );
      },
    };
  },
});

export default PrismaGenerator;
