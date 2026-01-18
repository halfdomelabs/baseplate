import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { adminCrudColumnContainerProvider } from '../_providers/admin-crud-column-container.js';

const descriptorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.int().nonnegative(),
  relationName: z.string().min(1),
  foreignModelIdFields: z.array(z.string().min(1)),
  isOptional: z.boolean().optional(),
  labelExpression: z.string().min(1),
});

export const adminCrudForeignColumnGenerator = createGenerator({
  name: 'admin/admin-crud-foreign-column',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.id,
  buildTasks: ({
    label,
    order,
    relationName,
    foreignModelIdFields,
    isOptional,
    labelExpression,
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudColumnContainer: adminCrudColumnContainerProvider,
      },
      run({ adminCrudColumnContainer }) {
        adminCrudColumnContainer.addColumn({
          label,
          order,
          content: (itemName) => {
            const optionalClause = isOptional
              ? `${itemName}.${relationName} == null ? "None" : `
              : '';
            return tsCodeFragment(`{
              ${optionalClause}
              ${itemName}.${relationName}.${labelExpression}
            }`);
          },
          graphQLFields: [
            {
              name: relationName,
              fields: [
                ...foreignModelIdFields.map((field) => ({ name: field })),
                { name: labelExpression },
              ],
            },
          ],
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
