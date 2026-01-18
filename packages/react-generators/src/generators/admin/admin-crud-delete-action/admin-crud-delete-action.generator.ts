import {
  tsHoistedFragment,
  tsImportBuilder,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { lowercaseFirstChar } from '@baseplate-dev/utils';
import { z } from 'zod';

import type { GraphQLOperation } from '#src/writers/graphql/graphql.js';

import {
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '#src/generators/core/index.js';
import { graphqlImportsProvider } from '#src/generators/index.js';
import { renderTadaOperation } from '#src/writers/graphql/gql-tada.js';

import { adminCrudActionContainerProvider } from '../_providers/admin-crud-action-container.js';
import { getModelNameVariants } from '../_utils/get-model-name-variants.js';

const descriptorSchema = z.object({
  order: z.int().nonnegative(),
  modelName: z.string().min(1),
  position: z.enum(['inline', 'dropdown']).default('dropdown'),
  nameField: z.string().min(1),
  idField: z.string().min(1),
});

export const adminCrudDeleteActionGenerator = createGenerator({
  name: 'admin/admin-crud-delete-action',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: () => 'delete',
  buildTasks: ({ order, position, modelName, nameField, idField }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudActionContainer: adminCrudActionContainerProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        reactErrorImports: reactErrorImportsProvider,
        graphqlImports: graphqlImportsProvider,
      },
      run({
        adminCrudActionContainer,
        reactComponentsImports,
        reactErrorImports,
        graphqlImports,
      }) {
        const parentComponentName =
          adminCrudActionContainer.getParentComponentName();
        const parentComponentPath =
          adminCrudActionContainer.getParentComponentPath();
        const itemsFragmentVariable =
          adminCrudActionContainer.getItemsFragmentVariable();
        const itemsFragment = tsTemplateWithImports([
          graphqlImports.ResultOf.typeDeclaration(),
        ])`ResultOf<typeof ${itemsFragmentVariable}>`;
        const modelNameVariants = getModelNameVariants(modelName);
        const modelTitle = modelNameVariants.title;

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
              <span className="sr-only">Delete</span>
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

        const deleteMutationName = `${parentComponentName}Delete${modelNameVariants.pascal}`;
        const deleteMutationVariable = `${lowercaseFirstChar(deleteMutationName)}Mutation`;
        const graphqlDeleteFieldName = `delete${modelNameVariants.pascal}`;
        const deleteMutation: GraphQLOperation = {
          type: 'mutation',
          variableName: deleteMutationVariable,
          operationName: deleteMutationName,
          variables: [
            { name: 'input', type: `Delete${modelNameVariants.pascal}Input!` },
          ],
          fields: [
            {
              name: graphqlDeleteFieldName,
              args: [
                {
                  name: 'input',
                  value: { type: 'variable', variable: 'input' },
                },
              ],
              fields: [
                {
                  name: modelNameVariants.camel,
                  fields: [{ name: idField }, { name: nameField }],
                },
              ],
            },
          ],
        };

        const deleteMutationHoistedFragment = renderTadaOperation(
          deleteMutation,
          { currentPath: parentComponentPath },
        );

        const hookContent = tsTemplateWithImports(
          [
            tsImportBuilder(['useMutation']).from('@apollo/client/react'),
            reactComponentsImports.useConfirmDialog.declaration(),
            tsImportBuilder(['toast']).from('sonner'),
            reactErrorImports.logAndFormatError.declaration(),
          ],
          {
            hoistedFragments: [
              tsHoistedFragment(
                'delete-action-mutation',
                deleteMutationHoistedFragment,
              ),
            ],
          },
        )`
          const { requestConfirm } = useConfirmDialog();
          const [${graphqlDeleteFieldName}] = useMutation(${deleteMutationVariable}, {
    update: (cache, result) => {
      if (!result.data?.${graphqlDeleteFieldName}.${modelNameVariants.camel}) return;
      const itemId = cache.identify(result.data.${graphqlDeleteFieldName}.${modelNameVariants.camel});
      cache.evict({ id: itemId });
      cache.gc();
    },
  });

  function handleDelete(item: ${itemsFragment}): void {
    requestConfirm({
      title: 'Delete ${modelTitle}',
      content: \`Are you sure you want to delete ${modelNameVariants.lowercaseWords} \${item.${nameField} ? item.${nameField} : 'unnamed ${modelNameVariants.lowercaseWords}'}?\`,
      onConfirm: () => {
        ${graphqlDeleteFieldName}({
          variables: { input: { ${idField}: item.${idField} } },
        })
          .then(() => {
            toast.success('Successfully deleted the ${modelNameVariants.lowercaseWords}!');
          })
          .catch((err: unknown) => {
            toast.error(
              logAndFormatError(err, 'Sorry, we could not delete the ${modelNameVariants.lowercaseWords}.'),
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
          graphQLFields: [{ name: idField }, { name: nameField }],
        });
        return {};
      },
    }),
  }),
});
