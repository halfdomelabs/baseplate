import { TypescriptCodeUtils } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelField: z.string().min(1),
  validation: z.string().min(1),
  isCheckbox: z.boolean().optional(),
});

const AdminCrudTextInputGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    adminCrudInputContainer: adminCrudInputContainerProvider,
    reactComponents: reactComponentsProvider,
  },
  createGenerator(
    { label, modelField, validation, isCheckbox },
    { adminCrudInputContainer, reactComponents }
  ) {
    const inputType = isCheckbox ? 'CheckedInput' : 'TextInput';
    adminCrudInputContainer.addInput({
      content: TypescriptCodeUtils.createExpression(
        `<${inputType}.LabelledController
          label="${label}"
          control={control}
          name="${modelField}"
        />`,
        `import { ${inputType} } from "%react-components"`,
        { importMappers: [reactComponents] }
      ),
      graphQLFields: [{ name: modelField }],
      validation: [
        {
          key: modelField,
          expression: TypescriptCodeUtils.createExpression(validation),
        },
      ],
    });
    return {
      build: async () => {},
    };
  },
});

export default AdminCrudTextInputGenerator;
