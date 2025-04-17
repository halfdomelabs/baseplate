import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { reactComponentsProvider } from '@src/generators/core/react-components/react-components.generator.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelField: z.string().min(1),
  isOptional: z.boolean().optional(),
  options: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    }),
  ),
});

export const adminCrudEnumInputGenerator = createGenerator({
  name: 'admin/admin-crud-enum-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelField,
  buildTasks: ({ label, modelField, options, isOptional }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        reactComponents: reactComponentsProvider,
      },
      run({ adminCrudInputContainer, reactComponents }) {
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
                      option.value,
                    )} }`,
                )
                .join(',\n')}
            ];`,
                ),
              ],
            },
          ),
          graphQLFields: [{ name: modelField }],
          validation: [
            {
              key: modelField,
              expression: TypescriptCodeUtils.createExpression(
                `z.enum([${options.map((o) => `"${o.value}"`).join(', ')}])${
                  isOptional ? '.nullish()' : ''
                }`,
              ),
            },
          ],
        });

        return {};
      },
    }),
  }),
});
