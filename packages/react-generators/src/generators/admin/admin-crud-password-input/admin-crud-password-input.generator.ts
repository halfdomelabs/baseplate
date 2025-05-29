import { tsCodeFragment, TsCodeUtils } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/react-components.generator.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelField: z.string().default('password'),
  order: z.number(),
});

export const adminCrudPasswordInputGenerator = createGenerator({
  name: 'admin/admin-crud-password-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelField,
  buildTasks: ({ label, modelField, order }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        reactComponentsImports: reactComponentsImportsProvider,
      },
      run({ adminCrudInputContainer, reactComponentsImports }) {
        adminCrudInputContainer.addInput({
          order,
          content: TsCodeUtils.mergeFragmentsAsJsxElement(
            'TextInput.LabelledController',
            {
              label,
              control: tsCodeFragment('control'),
              name: modelField,
              type: 'password',
              registerOptions: tsCodeFragment(
                '{ setValueAs: (val: string) => val === "" ? undefined : val }',
              ),
            },
            reactComponentsImports.TextInput.declaration(),
          ),
          graphQLFields: [],
          validation: [
            {
              key: modelField,
              expression: tsCodeFragment('z.string().nullish()'),
            },
          ],
        });
        return {
          build: async () => {
            /* empty */
          },
        };
      },
    }),
  }),
});
