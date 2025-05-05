import {
  tsCodeFragment,
  tsHoistedFragment,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { reactComponentsImportsProvider } from '@src/generators/core/react-components/react-components.generator.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  order: z.number(),
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
  buildTasks: ({ label, modelField, options, isOptional, order }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        reactComponentsImports: reactComponentsImportsProvider,
      },
      run({ adminCrudInputContainer, reactComponentsImports }) {
        adminCrudInputContainer.addInput({
          order,
          content: tsCodeFragment(
            `<SelectInput.LabelledController
          label="${label}"
          control={control}
          name="${modelField}"
          options={${modelField}Options}
        />`,
            reactComponentsImports.SelectInput.declaration(),
            {
              hoistedFragments: [
                tsHoistedFragment(
                  tsCodeFragment(
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
                  `${modelField}Options`,
                ),
              ],
            },
          ),
          graphQLFields: [{ name: modelField }],
          validation: [
            {
              key: modelField,
              expression: tsCodeFragment(
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
