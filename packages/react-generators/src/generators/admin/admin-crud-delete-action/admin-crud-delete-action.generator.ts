import {
  tsImportBuilder,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import {
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '#src/generators/core/index.js';
import { titleizeCamel } from '#src/utils/case.js';

import { adminCrudActionContainerProvider } from '../_providers/admin-crud-action-container.js';
import { adminCrudQueriesProvider } from '../admin-crud-queries/admin-crud-queries.generator.js';

const descriptorSchema = z.object({
  order: z.number().int().nonnegative(),
  modelName: z.string().min(1),
  position: z.enum(['inline', 'dropdown']).default('dropdown'),
  nameField: z.string().min(1),
});

export const adminCrudDeleteActionGenerator = createGenerator({
  name: 'admin/admin-crud-delete-action',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: () => 'delete',
  buildTasks: ({ order, position, modelName, nameField }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudActionContainer: adminCrudActionContainerProvider,
        adminCrudQueries: adminCrudQueriesProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        reactErrorImports: reactErrorImportsProvider,
      },
      run({
        adminCrudActionContainer,
        adminCrudQueries,
        reactComponentsImports,
        reactErrorImports,
      }) {
        const actionFragment =
          position === 'inline'
            ? tsTemplateWithImports([
                reactComponentsImports.Button.declaration(),
                tsImportBuilder(['MdDelete']).from('react-icons/md'),
              ])`
            <Button variant="ghost" size="icon" onClick={() => {
              handleDelete(item);
            }}>
              <MdDelete />
              <span className="sr-only">Edit</span>
            </Button>
        `
            : tsTemplateWithImports([
                reactComponentsImports.DropdownMenuItem.declaration(),
                tsImportBuilder(['MdDelete']).from('react-icons/md'),
              ])`
          <DropdownMenuItem onClick={() => {
              handleDelete(item);
            }}>
            <MdDelete className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        `;

        const modelTitle = titleizeCamel(modelName);
        const hookContent = tsTemplateWithImports([
          tsImportBuilder(['useMutation']).from('@apollo/client'),
          reactComponentsImports.useConfirmDialog.declaration(),
          tsImportBuilder(['toast']).from('sonner'),
          reactErrorImports.logAndFormatError.declaration(),
        ])`
          const { requestConfirm } = useConfirmDialog();
          const [${adminCrudQueries.getDeleteHookInfo().fieldName}] = useMutation(${adminCrudQueries.getDeleteHookInfo().documentExpression}, {
    refetchQueries: [{ query: ${adminCrudQueries.getListDocumentExpression()} }],
  });

  function handleDelete(item: ${adminCrudQueries.getRowFragmentExpression()}): void {
    requestConfirm({
      title: 'Delete ${modelTitle}',
      content: \`Are you sure you want to delete ${modelTitle.toLocaleLowerCase()} \${item.${nameField} ? item.${nameField} : 'unnamed ${modelTitle.toLocaleLowerCase()}'}?\`,
      onConfirm: () => {
        ${adminCrudQueries.getDeleteHookInfo().fieldName}({
          variables: { input: { id: item.id } },
        })
          .then(() => {
            toast.success('Successfully deleted ${modelTitle.toLocaleLowerCase()}!');
          })
          .catch((err: unknown) => {
            toast.error(
              logAndFormatError(err, 'Sorry we could not delete ${modelTitle.toLocaleLowerCase()}.'),
            );
          });
      },
    });
  }
        `;
        // For now, add a placeholder implementation
        // This will be replaced with actual delete functionality when table template is refactored
        adminCrudActionContainer.addAction({
          name: 'Delete',
          type: 'delete',
          position,
          order,
          hookContent,
          action: actionFragment,
          graphQLFields: [{ name: 'id' }, { name: nameField }],
        });
        return {};
      },
    }),
  }),
});
