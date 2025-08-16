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
  order: z.number().int().nonnegative(),
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
          <Link
            to="${reactRoutes.getRoutePrefix()}/$id"
            params={{ id: item.id }}
          >
            <Button variant="ghost" size="icon">
              <MdEdit />
              <span className="sr-only">Edit</span>
            </Button>
          </Link>
        `
            : tsTemplateWithImports([
                reactComponentsImports.DropdownMenuItem.declaration(),
                tsImportBuilder(['Link']).from('@tanstack/react-router'),
                tsImportBuilder(['MdEdit']).from('react-icons/md'),
              ])`
        <Link
            to="${reactRoutes.getRoutePrefix()}/$id"
            params={{ id: item.id }}
          >
          <DropdownMenuItem>
            <MdEdit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        </Link>
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
