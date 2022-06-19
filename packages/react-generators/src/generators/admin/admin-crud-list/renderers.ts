import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { z } from 'zod';
import { GraphQLField } from '@src/writers/graphql';

export const adminCrudTextRendererSchema = z.object({
  type: z.literal('text'),
  field: z.string().min(1),
});

export type AdminCrudTextRendererConfig = z.infer<
  typeof adminCrudTextRendererSchema
>;

export const adminCrudRendererSchema = adminCrudTextRendererSchema;

type AdminCrudRendererConfig = z.infer<typeof adminCrudRendererSchema>;

export const adminCrudTableColumnSchema = z.object({
  label: z.string().min(1),
  renderer: adminCrudRendererSchema,
});

export type RendererType = z.infer<typeof adminCrudRendererSchema>['type'];

interface RendererOutput {
  content: TypescriptCodeExpression;
  graphQLFields: GraphQLField[];
}

interface Renderer<Type extends RendererType> {
  name: Type;
  render: (
    config: AdminCrudRendererConfig & { type: Type },
    itemName: string
  ) => RendererOutput;
}

export const ADMIN_CRUD_RENDERERS: Record<
  RendererType,
  Renderer<RendererType>
> = {
  text: {
    name: 'text',
    render: (config, itemName) => ({
      content: TypescriptCodeUtils.createExpression(
        `{${itemName}.${config.field}}`
      ),
      graphQLFields: [{ name: config.field }],
    }),
  },
};
