import { tsTemplateWithImports } from '@baseplate-dev/core-generators';
import {
  adminCrudColumnContainerProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

const descriptorSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  label: z.string().min(1),
});

export const adminCrudRolesColumnGenerator = createGenerator({
  name: 'local-auth/admin/admin-crud-roles-column',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.id,
  buildTasks: ({ order, label }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudColumnContainer: adminCrudColumnContainerProvider,
        reactComponentsImports: reactComponentsImportsProvider,
      },
      run({ adminCrudColumnContainer, reactComponentsImports }) {
        adminCrudColumnContainer.addColumn({
          label,
          order,
          display: {
            content: (itemName) =>
              tsTemplateWithImports([
                reactComponentsImports.Badge.declaration(),
              ])`
                <div className="flex flex-wrap gap-1">
                  {${itemName}.roles.map((userRole) => (
                    <Badge
                      key={userRole.role}
                      variant="secondary"
                    >
                      {userRole.role}
                    </Badge>
                  ))}
                  {${itemName}.roles.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No roles
                    </span>
                  )}
                </div>
              `,
            graphQLFields: [
              {
                name: 'roles',
                fields: [{ name: 'role' }],
              },
            ],
          },
        });
        return {};
      },
    }),
  }),
});
