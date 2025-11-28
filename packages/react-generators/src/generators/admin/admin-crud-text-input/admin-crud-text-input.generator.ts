import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import type { ReactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  order: z.number(),
  modelField: z.string().min(1),
  validation: z.string().min(1),
  type: z.enum(['text', 'checked', 'date', 'dateTime']).default('text'),
  isNumber: z.boolean().optional(),
});

type TextInputType = z.infer<typeof descriptorSchema>['type'];

const INPUT_TYPE_MAP: Record<
  TextInputType,
  keyof ReactComponentsImportsProvider
> = {
  checked: 'CheckboxFieldController',
  date: 'DatePickerFieldController',
  dateTime: 'DateTimePickerFieldController',
  text: 'InputFieldController',
};

export const adminCrudTextInputGenerator = createGenerator({
  name: 'admin/admin-crud-text-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelField,
  buildTasks: ({ label, modelField, validation, type, order, isNumber }) => ({
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
            `<${inputType}
          label="${label}"
          control={control}
          name="${modelField}"
          ${isNumber ? 'registerOptions={{ valueAsNumber: true }}' : ''}
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
