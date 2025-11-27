import {
  tsImportBuilder,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactComponentsImportsProvider } from '#src/generators/core/index.js';
import { reactRoutesProvider } from '#src/providers/routes.js';

import { adminCrudActionContainerProvider } from '../_providers/admin-crud-action-container.js';

const descriptorSchema = z.object({
  order: z.int().nonnegative(),
  position: z.enum(['inline', 'dropdown']).default('inline'),
});

export const adminCrudEditActionGenerator = createGenerator({
  name: 'admin/admin-crud-edit-action',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: () => 'edit',
  buildTasks: ({ order, position }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudActionContainer: adminCrudActionContainerProvider,
        reactRoutes: reactRoutesProvider,
        reactComponentsImports: reactComponentsImportsProvider,
      },
      run({ adminCrudActionContainer, reactRoutes, reactComponentsImports }) {
        const actionFragment =
          position === 'inline'
            ? tsTemplateWithImports([
                tsImportBuilder(['Link']).from('@tanstack/react-router'),
                reactComponentsImports.Button.declaration(),
                tsImportBuilder(['MdEdit']).from('react-icons/md'),
              ])`
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="${reactRoutes.getRoutePrefix()}/$id"
              params={{ id: item.id }}
            >
              <MdEdit />
              <span className="sr-only">Edit</span>
            </Link>
          </Button>
        `
            : tsTemplateWithImports([
                reactComponentsImports.DropdownMenuItem.declaration(),
                tsImportBuilder(['Link']).from('@tanstack/react-router'),
                tsImportBuilder(['MdEdit']).from('react-icons/md'),
              ])`
          <DropdownMenuItem asChild>
            <Link
              to="${reactRoutes.getRoutePrefix()}/$id"
              params={{ id: item.id }}
            >
              <MdEdit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
        `;
        adminCrudActionContainer.addAction({
          name: 'Edit',
          type: 'edit',
          position,
          order,
          action: actionFragment,
        });
        return {};
      },
    }),
  }),
});
