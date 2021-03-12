import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  TypescriptCodeWrapper,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { nexusSchemaProvider } from '../nexus-schema';

interface NexusObjectionTypeDescriptor extends GeneratorDescriptor {
  name: string;
}

const descriptorSchema = {
  name: yup.string().required(),
};

export type NexusObjectionTypeProvider = {
  addField(field: TypescriptCodeBlock): void;
};

export const nexusObjectionTypeProvider = createProviderType<NexusObjectionTypeProvider>(
  'nexus-objection-type'
);

const NexusObjectionTypeGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<NexusObjectionTypeDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    nexusSchema: nexusSchemaProvider,
  },
  exports: {
    nexusObjectionType: nexusObjectionTypeProvider,
  },
  childGenerators: {
    fields: { multiple: true },
  },
  createGenerator(descriptor, { nexusSchema }) {
    const typeName = `${descriptor.name}Type`;
    const fields: TypescriptCodeBlock[] = [];
    return {
      getProviders: () => ({
        nexusObjectionType: {
          addField(field) {
            fields.push(field);
          },
        },
      }),
      build: (context) => {
        const fieldWrapper: TypescriptCodeWrapper = {
          wrap: (code: string) =>
            `
export const ${typeName} = objectType({
  name: '${descriptor.name}',
  definition: (t) => {
    ${code}
  }
})
`.trim(),
          importText: ["import { objectType } from 'nexus';"],
        };

        nexusSchema
          .getSchemaFile()
          .addCodeBlock(
            'FIELDS',
            TypescriptCodeUtils.wrapBlock(
              TypescriptCodeUtils.mergeBlocks(fields),
              fieldWrapper
            )
          );
      },
    };
  },
});

export default NexusObjectionTypeGenerator;
