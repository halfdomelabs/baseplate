import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelField: z.string().default('password'),
});

export const adminCrudPasswordInputGenerator = createGenerator({
  name: 'admin/admin-crud-password-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelField,
  buildTasks: ({ label, modelField }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        reactComponents: reactComponentsProvider,
      },
      run({ adminCrudInputContainer, reactComponents }) {
        adminCrudInputContainer.addInput({
          content: TypescriptCodeUtils.createExpression(
            `<TextInput.LabelledController
          label="${label}"
          control={control}
          name="${modelField}"
          type="password"
          registerOptions={{ setValueAs: (val: string) => val === '' ? undefined : val }}
        />`,
            `import { TextInput } from "%react-components"`,
            { importMappers: [reactComponents] },
          ),
          graphQLFields: [],
          validation: [
            {
              key: modelField,
              expression: TypescriptCodeUtils.createExpression(
                'z.string().nullish()',
              ),
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
