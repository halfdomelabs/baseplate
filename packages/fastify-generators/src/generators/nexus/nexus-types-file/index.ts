import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { paramCase } from 'change-case';
import R from 'ramda';
import { z } from 'zod';
import { appModuleProvider } from '@src/generators/core/root-module';
import { nexusSchemaProvider } from '../nexus';

const descriptorSchema = z.object({
  name: z.string().min(1),
  categoryOrder: z.array(z.string()).optional(),
});

type Config = z.infer<typeof descriptorSchema>;

interface NexusType {
  name?: string;
  block: TypescriptCodeBlock;
  category?: string;
}

export interface NexusTypesFileProvider {
  registerType(type: NexusType): void;
}

export const nexusTypesFileProvider =
  createProviderType<NexusTypesFileProvider>('nexus-types-file');

export const createNexusTypesFileTask = createTaskConfigBuilder(
  ({ name, categoryOrder }: Config) => ({
    name: 'nexus-types-file',
    dependencies: {
      appModule: appModuleProvider,
      typescript: typescriptProvider,
      nexusSchema: nexusSchemaProvider,
    },
    exports: {
      nexusTypes: nexusTypesFileProvider,
    },
    run({ appModule, typescript, nexusSchema }) {
      const typesPath = `${appModule.getModuleFolder()}/schema/${paramCase(
        name
      )}.ts`;

      appModule.registerFieldEntry(
        'schemaTypes',
        new TypescriptCodeExpression(
          name,
          `import * as ${name} from '@/${typesPath.replace(/\.ts$/, '')}'`
        )
      );

      nexusSchema.registerSchemaFile(typesPath);

      const registeredKeys: string[] = [];

      const types: NexusType[] = [];

      return {
        getProviders: () => ({
          nexusTypes: {
            registerType(type) {
              const { name: typeName } = type;
              if (typeName) {
                if (registeredKeys.includes(typeName)) {
                  return;
                }
                const isSchemaTypeUnregistered =
                  nexusSchema.registerSchemaType(typeName);
                if (!isSchemaTypeUnregistered) {
                  return;
                }
                registeredKeys.push(typeName);
              }
              types.push(type);
            },
          },
        }),
        build: async (builder) => {
          const orderedTypes = R.sortBy((type) => {
            if (!type.category || !categoryOrder?.includes(type.category)) {
              return (categoryOrder || []).length;
            }
            return categoryOrder.indexOf(type.category);
          }, types);

          const typesFile = typescript.createTemplate({
            TYPES: TypescriptCodeUtils.mergeBlocks(
              orderedTypes.map((t) => t.block),
              '\n\n'
            ),
          });

          await builder.apply(
            typesFile.renderToActionFromText('TYPES', typesPath)
          );
        },
      };
    },
  })
);

const NexusTypesFileGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createNexusTypesFileTask(descriptor));
  },
});

export default NexusTypesFileGenerator;
