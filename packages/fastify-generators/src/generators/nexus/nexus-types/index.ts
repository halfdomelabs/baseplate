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

export interface NexusTypesProvider {
  registerType(block: TypescriptCodeBlock): void;
}

export const nexusTypesProvider =
  createProviderType<NexusTypesProvider>('nexus-types');

const NexusTypesGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    appModule: appModuleProvider,
    typescript: typescriptProvider,
    nexusSchema: nexusSchemaProvider,
  },
  exports: {
    nexusTypes: nexusTypesProvider,
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
      build: async (builder) => {
        await builder.apply(
          typesFile.renderToActionFromText('TYPES', typesPath)
        );
      },
    };
  },
});

export default NexusTypesGenerator;
