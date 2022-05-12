import {
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
  crudServiceRef: yup.string().required(),
});

const NexusPrismaCrudFileGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: (descriptor) => {
    const sharedValues = {
      generator: '@baseplate/fastify/nexus/nexus-prisma-crud-mutation',
      modelName: descriptor.modelName,
      crudServiceRef: descriptor.crudServiceRef,
    };
    return {
      create: {
        defaultDescriptor: {
          ...sharedValues,
          type: 'create',
        },
      },
      update: {
        defaultDescriptor: {
          ...sharedValues,
          type: 'update',
        },
      },
      delete: {
        defaultDescriptor: {
          ...sharedValues,
          type: 'delete',
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
    const registeredKeys: string[] = [];

    return {
      getProviders: () => ({
        nexusTypes: {
          registerType(block, key) {
            if (key) {
              if (registeredKeys.includes(key)) {
                return;
              }
              registeredKeys.push(key);
            }
            typesFile.addCodeBlock('TYPES', block);
          },
        },
      }),
      build: async (builder) => {
        await builder.apply(
          typesFile.renderToActionFromText('TYPES', typesPath)
        );
      },
    };
  },
});

export default NexusPrismaCrudFileGenerator;
