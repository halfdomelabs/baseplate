import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { z } from 'zod';
import { GraphQLField } from '@src/writers/graphql';

export const adminCrudTextInputSchema = z.object({
  type: z.literal('text'),
  label: z.string().min(1),
  modelField: z.string().min(1),
  validation: z.string().min(1),
});

export const adminCrudInputSchema = adminCrudTextInputSchema;

export type AdminCrudInputConfig = z.infer<typeof adminCrudInputSchema>;

export type InputType = AdminCrudInputConfig['type'];

interface InputRenderResult {
  content: TypescriptCodeExpression;
  graphQLFields: GraphQLField[];
  validation: { key: string; expression: TypescriptCodeExpression }[];
}

interface Input<Type extends InputType> {
  name: Type;
  render: (config: AdminCrudInputConfig & { type: Type }) => InputRenderResult;
}

export const ADMIN_CRUD_INPUTS: Record<InputType, Input<InputType>> = {
  text: {
    name: 'text',
    render: (config) => ({
      content: TypescriptCodeUtils.createExpression(
        `<TextInput.LabelledController
          label="${config.label}"
          control={control}
          name="${config.modelField}"
        />`,
        'import { TextInput } from "%react-components"'
      ),
      graphQLFields: [{ name: config.modelField }],
      validation: [
        {
          key: config.modelField,
          expression: TypescriptCodeUtils.createExpression(config.validation),
        },
      ],
    }),
  },
};
