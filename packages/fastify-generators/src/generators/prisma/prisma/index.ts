import {
  copyTypescriptFileAction,
  nodeProvider,
  projectProvider,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import * as yup from 'yup';
import { configServiceProvider } from '@src/generators/core/config-service';
import {
  createPrismaSchemaDatasourceBlock,
  createPrismaSchemaGeneratorBlock,
  PrismaModelBlock,
  PrismaSchemaFile,
} from '@src/writers/prisma-schema';

const descriptorSchema = yup.object({
  defaultPort: yup.string().default('5432'),
  defaultDatabaseUrl: yup.string(),
});

export interface PrismaGeneratorConfig {
  setting?: string;
}

export interface PrismaProvider {
  getConfig(): NonOverwriteableMap<PrismaGeneratorConfig>;
  addPrismaModel(model: PrismaModelBlock): void;
}

export const prismaProvider = createProviderType<PrismaProvider>('prisma');

const PrismaGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    configService: configServiceProvider,
    project: projectProvider,
  },
  exports: {
    prisma: prismaProvider,
  },
  createGenerator(descriptor, { node, configService, project }) {
    const config = createNonOverwriteableMap({}, { name: 'prisma-config' });
    const prismaModelMap: NonOverwriteableMap<
      Record<string, PrismaModelBlock>
    > = createNonOverwriteableMap({}, { name: 'prisma-models' });

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
      }.postgres?schema=public`;

    configService.getConfigEntries().set('DATABASE_URL', {
      comment: 'Connection URL of the database',
      value: TypescriptCodeUtils.createExpression('yup.string().required()'),
      exampleValue: defaultDatabaseUrl,
    });

    return {
      getProviders: () => ({
        prisma: {
          getConfig: () => config,
          addPrismaModel: (model) => {
            prismaModelMap.set(model.name, model);
          },
        },
      }),
      build: async (builder) => {
        const models = Object.values(prismaModelMap.value());
        models.forEach((model) => schemaFile.addModelBlock(model));

        builder.writeFile('prisma/schema.prisma', schemaFile.toText());

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
