import { tsCodeFragment, TsCodeUtils } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';

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
            'InputFieldController',
            {
              label,
              control: tsCodeFragment('control'),
              name: modelField,
              type: 'password',
              registerOptions: tsCodeFragment(
                '{ setValueAs: (val: string) => val === "" ? undefined : val }',
              ),
            },
            reactComponentsImports.InputFieldController.declaration(),
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
