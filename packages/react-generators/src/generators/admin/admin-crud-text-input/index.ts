import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';
import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelField: z.string().min(1),
  validation: z.string().min(1),
  type: z.enum(['text', 'checked', 'date', 'dateTime']).default('text'),
});

type TextInputType = z.infer<typeof descriptorSchema>['type'];

const INPUT_TYPE_MAP: Record<TextInputType, string> = {
  checked: 'CheckedInput',
  date: 'ReactDatePickerInput',
  dateTime: 'ReactDatePickerInput',
  text: 'TextInput',
};

const AdminCrudTextInputGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    adminCrudInputContainer: adminCrudInputContainerProvider,
    reactComponents: reactComponentsProvider,
  },
  createGenerator(
    { label, modelField, validation, type },
    { adminCrudInputContainer, reactComponents }
  ) {
    const inputType = INPUT_TYPE_MAP[type];
    adminCrudInputContainer.addInput({
      content: TypescriptCodeUtils.createExpression(
        `<${inputType}.LabelledController
          label="${label}"
          control={control}
          name="${modelField}"
          ${type === 'dateTime' ? 'showTimeSelect' : ''}
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
    return {};
  },
});

export default AdminCrudTextInputGenerator;
