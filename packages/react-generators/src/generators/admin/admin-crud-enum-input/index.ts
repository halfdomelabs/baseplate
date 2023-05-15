import { quot, TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelField: z.string().min(1),
  isOptional: z.boolean().optional(),
  options: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    })
  ),
});

const AdminCrudEnumInputGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    adminCrudInputContainer: adminCrudInputContainerProvider,
    reactComponents: reactComponentsProvider,
  },
  createGenerator(
    { label, modelField, options, isOptional },
    { adminCrudInputContainer, reactComponents }
  ) {
    adminCrudInputContainer.addInput({
      content: TypescriptCodeUtils.createExpression(
        `<SelectInput.LabelledController
          label="${label}"
          control={control}
          name="${modelField}"
          options={${modelField}Options}
        />`,
        'import { SelectInput } from "%react-components"',
        {
          importMappers: [reactComponents],
          headerBlocks: [
            TypescriptCodeUtils.createBlock(
              `const ${modelField}Options = [
              ${options
                .map(
                  (option) =>
                    `{ label: ${quot(option.label)}, value: ${quot(
                      option.value
                    )} }`
                )
                .join(',\n')}
            ];`
            ),
          ],
        }
      ),
      graphQLFields: [{ name: modelField }],
      validation: [
        {
          key: modelField,
          expression: TypescriptCodeUtils.createExpression(
            `z.enum([${options.map((o) => `"${o.value}"`).join(', ')}])${
              isOptional ? '.nullish()' : ''
            }`
          ),
        },
      ],
    });

    return {
      build: async () => {},
    };
  },
});

export default AdminCrudEnumInputGenerator;
