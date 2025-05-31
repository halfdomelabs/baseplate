import { tsCodeFragment } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactApolloProvider } from '#src/generators/apollo/react-apollo/react-apollo.generator.js';

import { adminCrudDisplayContainerProvider } from '../_providers/admin-crud-display-container.js';
import { createForeignDataDependency } from '../_utils/foreign-data-dependency.js';

const descriptorSchema = z.object({
  localField: z.string().min(1),
  isOptional: z.boolean().optional(),
  foreignModelName: z.string().min(1),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1),
});

export type AdminCrudForeignDisplayProvider = unknown;

export const adminCrudForeignDisplayProvider =
  createProviderType<AdminCrudForeignDisplayProvider>(
    'admin-crud-foreign-display',
  );

export const adminCrudForeignDisplayGenerator = createGenerator({
  name: 'admin/admin-crud-foreign-display',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.localField,
  buildTasks: ({
    localField,
    isOptional,
    foreignModelName,
    labelExpression,
    valueExpression,
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudDisplayContainer: adminCrudDisplayContainerProvider,
        reactApollo: reactApolloProvider,
      },
      exports: {
        adminCrudForeignDisplay: adminCrudForeignDisplayProvider.export(),
      },
      run({ adminCrudDisplayContainer, reactApollo }) {
        const modelName = adminCrudDisplayContainer.getModelName();

        const { dataDependency, propName } = createForeignDataDependency({
          foreignModelName,
          modelName,
          reactApollo,
          labelExpression,
          valueExpression,
        });

        adminCrudDisplayContainer.addDisplay({
          content: (itemName) => {
            const optionalClause = isOptional
              ? `${itemName}.${localField} == null ? "None" : `
              : '';
            return tsCodeFragment(`{
            ${optionalClause}
            ${propName}.find(option => option.${valueExpression} === ${itemName}.${localField})?.${labelExpression}
            || "Unknown Item"}`);
          },
          graphQLFields: [{ name: localField }],
          dataDependencies: [dataDependency],
        });

        return {
          providers: {
            adminCrudForeignDisplay: {},
          },
        };
      },
    }),
  }),
});
