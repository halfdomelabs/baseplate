import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { paramCase } from 'change-case';
import * as yup from 'yup';
import { appModuleProvider } from '@src/generators/core/root-module';
import { nexusSchemaProvider } from '../nexus';
import { nexusTypesFileProvider } from '../nexus-types-file';

const descriptorSchema = yup.object({
  name: yup.string().required(),
  modelName: yup.string().required(),
});

const NexusPrismaQueryFileGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: (descriptor) => {
    const sharedValues = {
      modelName: descriptor.modelName,
    };
    return {
      objectType: {
        defaultDescriptor: {
          ...sharedValues,
          generator: '@baseplate/fastify/nexus/nexus-prisma-object',
        },
      },
      findQuery: {
        defaultDescriptor: {
          ...sharedValues,
          generator: '@baseplate/fastify/nexus/nexus-prisma-find-query',
        },
      },
      listQuery: {
        defaultDescriptor: {
          ...sharedValues,
          generator: '@baseplate/fastify/nexus/nexus-prisma-list-query',
        },
      },
    };
  },
  dependencies: {
    appModule: appModuleProvider,
    typescript: typescriptProvider,
    nexusSchema: nexusSchemaProvider,
  },
  exports: {
    nexusTypes: nexusTypesFileProvider,
  },
  createGenerator({ name }, { appModule, typescript, nexusSchema }) {
    const typesPath = `${appModule.getModuleFolder()}/schema/${paramCase(
      name
    )}.ts`;
    const typesFile = typescript.createTemplate({
      TYPES: { type: 'code-block' },
    });

    appModule.registerFieldEntry(
      'schemaTypes',
      new TypescriptCodeExpression(
        name,
        `import * as ${name} from '@/${typesPath.replace(/\.ts$/, '')}'`
      )
    );

    nexusSchema.registerSchemaFile(typesPath);

    return {
      getProviders: () => ({
        nexusTypes: {
          registerType(block: TypescriptCodeBlock) {
            typesFile.addCodeBlock('TYPES', block);
          },
        },
      }),
      build: async () => {},
    };
  },
});

export default NexusPrismaQueryFileGenerator;
