import { tsCodeFragment } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import type { ReactComponentsImportsProvider } from '#src/generators/core/react-components/react-components.generator.js';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/react-components.generator.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  order: z.number(),
  modelField: z.string().min(1),
  validation: z.string().min(1),
  type: z.enum(['text', 'checked', 'date', 'dateTime']).default('text'),
});

type TextInputType = z.infer<typeof descriptorSchema>['type'];

const INPUT_TYPE_MAP: Record<
  TextInputType,
  keyof ReactComponentsImportsProvider
> = {
  checked: 'CheckedInput',
  date: 'ReactDatePickerInput',
  dateTime: 'ReactDatePickerInput',
  text: 'TextInput',
};

export const adminCrudTextInputGenerator = createGenerator({
  name: 'admin/admin-crud-text-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelField,
  buildTasks: ({ label, modelField, validation, type, order }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        reactComponentsImports: reactComponentsImportsProvider,
      },
      run({ adminCrudInputContainer, reactComponentsImports }) {
        const inputType = INPUT_TYPE_MAP[type];
        adminCrudInputContainer.addInput({
          order,
          content: tsCodeFragment(
            `<${inputType}.LabelledController
          label="${label}"
          control={control}
          name="${modelField}"
          ${type === 'dateTime' ? 'showTimeSelect' : ''}
        />`,
            reactComponentsImports[inputType].declaration(),
          ),
          graphQLFields: [{ name: modelField }],
          validation: [
            {
              key: modelField,
              expression: tsCodeFragment(validation),
            },
          ],
        });
        return {};
      },
    }),
  }),
});
