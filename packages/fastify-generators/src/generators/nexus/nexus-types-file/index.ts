import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { paramCase } from 'change-case';
import * as yup from 'yup';
import { appModuleProvider } from '@src/generators/core/root-module';
import { nexusSchemaProvider } from '../nexus';

const descriptorSchema = yup.object({
  name: yup.string().required(),
});

export interface NexusTypesFileProvider {
  registerType(block: TypescriptCodeBlock, key?: string): void;
}

export const nexusTypesFileProvider =
  createProviderType<NexusTypesFileProvider>('nexus-types-file');

const NexusTypesFileGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
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
              const isSchemaTypeGloballyRegistered =
                nexusSchema.registerSchemaType(key);
              if (isSchemaTypeGloballyRegistered) {
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

export default NexusTypesFileGenerator;
