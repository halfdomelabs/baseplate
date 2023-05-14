import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelField: z.string().default('password'),
});

const AdminCrudTextInputGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    adminCrudInputContainer: adminCrudInputContainerProvider,
    reactComponents: reactComponentsProvider,
  },
  createGenerator(
    { label, modelField },
    { adminCrudInputContainer, reactComponents }
  ) {
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
        { importMappers: [reactComponents] }
      ),
      graphQLFields: [],
      validation: [
        {
          key: modelField,
          expression: TypescriptCodeUtils.createExpression(
            'z.string().nullish()'
          ),
        },
      ],
    });
    return {
      build: async () => {},
    };
  },
});

export default AdminCrudTextInputGenerator;
