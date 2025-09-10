import { tsCodeFragment } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactApolloProvider } from '#src/generators/apollo/react-apollo/index.js';

import { adminCrudColumnContainerProvider } from '../_providers/admin-crud-column-container.js';
import { createForeignDataDependency } from '../_utils/foreign-data-dependency.js';

const descriptorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.number().int().nonnegative(),
  localField: z.string().min(1),
  isOptional: z.boolean().optional(),
  foreignModelName: z.string().min(1),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1),
});

export type AdminCrudForeignColumnProvider = unknown;

export const adminCrudForeignColumnProvider =
  createProviderType<AdminCrudForeignColumnProvider>(
    'admin-crud-foreign-column',
  );

export const adminCrudForeignColumnGenerator = createGenerator({
  name: 'admin/admin-crud-foreign-column',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.id,
  buildTasks: ({
    label,
    order,
    localField,
    isOptional,
    foreignModelName,
    labelExpression,
    valueExpression,
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudColumnContainer: adminCrudColumnContainerProvider,
        reactApollo: reactApolloProvider,
      },
      exports: {
        adminCrudForeignColumn: adminCrudForeignColumnProvider.export(),
      },
      run({ adminCrudColumnContainer, reactApollo }) {
        const modelName = adminCrudColumnContainer.getModelName();

        const { dataDependency, propName } = createForeignDataDependency({
          foreignModelName,
          modelName,
          reactApollo,
          labelExpression,
          valueExpression,
        });

        adminCrudColumnContainer.addColumn({
          label,
          order,
          display: {
            content: (itemName) => {
              const optionalClause = isOptional
                ? `${itemName}.${localField} == null ? "None" : `
                : '';
              return tsCodeFragment(`{
            ${optionalClause}
            ${propName}.find(option => option.${valueExpression} === ${itemName}.${localField})?.${labelExpression}
            ?? "Unknown Item"}`);
            },
            graphQLFields: [{ name: localField }],
            dataDependencies: [dataDependency],
          },
        });

        return {
          providers: {
            adminCrudForeignColumn: {},
          },
        };
      },
    }),
  }),
});
