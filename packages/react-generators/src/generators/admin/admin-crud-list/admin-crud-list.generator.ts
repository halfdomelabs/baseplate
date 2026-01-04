import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { lowercaseFirstChar, quot } from '@baseplate-dev/utils';
import { kebabCase } from 'es-toolkit';
import { z } from 'zod';

import type {
  GraphQLFragment,
  GraphQLOperation,
} from '#src/writers/graphql/index.js';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';
import {
  graphqlImportsProvider,
  renderDataLoaders,
} from '#src/generators/index.js';
import { reactRoutesProvider } from '#src/providers/routes.js';
import { titleizeCamel } from '#src/utils/case.js';
import {
  mergeGraphqlFields,
  renderTadaFragment,
  renderTadaOperation,
} from '#src/writers/graphql/index.js';

import type { AdminCrudAction } from '../_providers/admin-crud-action-container.js';
import type { AdminCrudColumn } from '../_providers/admin-crud-column-container.js';
import type { DataLoader } from '../_utils/data-loader.js';

import { adminCrudActionContainerProvider } from '../_providers/admin-crud-action-container.js';
import { adminCrudColumnContainerProvider } from '../_providers/admin-crud-column-container.js';
import { getModelNameVariants } from '../_utils/get-model-name-variants.js';
import { ADMIN_ADMIN_CRUD_LIST_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  modelId: z.string(),
  modelName: z.string(),
  disableCreate: z.boolean().optional(),
});

export const adminCrudListGenerator = createGenerator({
  name: 'admin/admin-crud-list',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelName,
  buildTasks: ({ modelId, modelName, disableCreate }) => ({
    renderers: ADMIN_ADMIN_CRUD_LIST_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactRoutes: reactRoutesProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        renderers: ADMIN_ADMIN_CRUD_LIST_GENERATED.renderers.provider,
        graphqlImports: graphqlImportsProvider,
      },
      exports: {
        adminCrudActionContainer: adminCrudActionContainerProvider.export(),
        adminCrudColumnContainer: adminCrudColumnContainerProvider.export(),
      },
      run({
        typescriptFile,
        reactRoutes,
        reactComponentsImports,
        renderers,
        graphqlImports,
      }) {
        const modelNameVariants = getModelNameVariants(modelName);
        const routePrefix = reactRoutes.getRoutePrefix();
        const routeFilePath = reactRoutes.getRouteFilePath();
        const actions: AdminCrudAction[] = [];
        const columns: AdminCrudColumn[] = [];
        const listPagePath = `${reactRoutes.getOutputRelativePath()}/index.tsx`;
        const tableComponentPath = `${reactRoutes.getOutputRelativePath()}/-components/${kebabCase(modelName)}-table.tsx`;
        const tableComponentName = `${modelNameVariants.pascal}Table`;

        const tableItemsFragmentVariable = `${modelNameVariants.camel}TableItemsFragment`;

        const pagePrefix = `${modelNameVariants.pluralPascal}List`;
        const itemsQueryName = `${pagePrefix}${modelNameVariants.pluralPascal}`;
        const listPageComponentName = `${modelName}ListPage`;

        return {
          providers: {
            adminCrudActionContainer: {
              addAction: (action) => actions.push(action),
              getModelName: () => modelName,
              getParentComponentName: () => listPageComponentName,
              getParentComponentPath: () => listPagePath,
              getItemsFragmentVariable: () => tableItemsFragmentVariable,
            },
            adminCrudColumnContainer: {
              addColumn: (input) => columns.push(input),
              getModelName: () => modelName,
            },
          },
          build: async (builder) => {
            const sortedActions = actions.sort((a, b) => a.order - b.order);
            const sortedColumns = columns.sort((a, b) => a.order - b.order);

            const listPageLoader: DataLoader = {
              propName: 'items',
              routeLoaderFields: [
                {
                  key: 'queryRef',
                  value: tsTemplate`preloadQuery(${itemsQueryName})`,
                  contextFields: ['preloadQuery'],
                },
              ],
              propType: tsTemplate`${graphqlImports.FragmentOf.typeFragment()}<typeof ${tableItemsFragmentVariable}>[]`,
              pageComponentBody: tsTemplateWithImports([
                tsImportBuilder(['useReadQuery']).from('@apollo/client/react'),
              ])`const { data } = useReadQuery(queryRef);`,
              propPageValue: tsTemplate`data.${modelNameVariants.graphqlList}`,
            };

            const dataLoaders = [
              listPageLoader,
              ...columns.flatMap((c) => c.dataLoaders ?? []),
              ...actions.flatMap((a) => a.dataLoaders ?? []),
            ];

            // Render table component
            const tableItemsFragmentName = `${modelNameVariants.pascal}_items`;

            const tableItemsFragment: GraphQLFragment = {
              fragmentName: tableItemsFragmentName,
              fields: mergeGraphqlFields([
                ...actions.flatMap((a) => a.graphQLFields ?? []),
                ...columns.flatMap((c) => c.graphQLFields),
              ]),
              onType: modelNameVariants.graphqlObjectType,
              variableName: tableItemsFragmentVariable,
              path: tableComponentPath,
            };

            const inlineActions = sortedActions.filter(
              (c) => c.position === 'inline',
            );
            const dropdownActions = sortedActions.filter(
              (c) => c.position === 'dropdown',
            );

            const inlineActionFragment = TsCodeUtils.mergeFragmentsPresorted(
              inlineActions.map((a) => a.action),
            );

            const dropdownActionFragment =
              dropdownActions.length > 0
                ? tsTemplateWithImports([
                    reactComponentsImports.DropdownMenu.declaration(),
                    reactComponentsImports.DropdownMenuTrigger.declaration(),
                    reactComponentsImports.Button.declaration(),
                    reactComponentsImports.DropdownMenuContent.declaration(),
                    tsImportBuilder(['MdMoreVert']).from('react-icons/md'),
                  ])`
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MdMoreVert />
                        <span className="sr-only">More actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      ${TsCodeUtils.mergeFragmentsPresorted(
                        dropdownActions.map((a) => a.action),
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
              `
                : '';

            const actionCellFragment =
              sortedActions.length > 0
                ? tsTemplateWithImports([
                    reactComponentsImports.TableCell.declaration(),
                  ])`
              <TableCell className="flex items-center gap-2">
                ${inlineActionFragment}
                ${dropdownActionFragment}
              </TableCell>
            `
                : undefined;

            const TableHead = reactComponentsImports.TableHead.fragment();

            const headers = [
              ...sortedColumns.map(
                (column) =>
                  tsTemplate`<${TableHead}>${column.label}</${TableHead}>`,
              ),
              ...(sortedActions.length > 0
                ? [
                    tsTemplate`<${TableHead} className="w-12">Actions</${TableHead}>`,
                  ]
                : []),
            ];
            const cells = sortedColumns.map(
              (column) =>
                tsTemplateWithImports(
                  reactComponentsImports.TableCell.declaration(),
                )`<TableCell>${column.content('item')}</TableCell>`,
            );

            await builder.apply(
              renderers.table.render({
                id: `table-${modelId}`,
                destination: tableComponentPath,
                variables: {
                  TPL_COMPONENT_NAME: tableComponentName,
                  TPL_ITEMS_FRAGMENT_NAME: tableItemsFragmentVariable,
                  TPL_ITEMS_FRAGMENT: renderTadaFragment(tableItemsFragment, {
                    currentPath: tableComponentPath,
                    exported: true,
                  }),
                  TPL_PROPS: TsCodeUtils.mergeFragmentsAsInterfaceContent(
                    Object.fromEntries(
                      dataLoaders.map((d) => [d.propName, d.propType]),
                    ),
                  ),
                  TPL_DESTRUCTURED_PROPS: `{${dataLoaders
                    .map((d) => d.propName)
                    .join(', ')}}`,
                  TPL_ACTION_HOOKS: TsCodeUtils.mergeFragmentsPresorted(
                    sortedActions.map((a) => a.hookContent),
                  ),
                  TPL_PLURAL_MODEL: modelNameVariants.pluralTitle,
                  TPL_HEADERS: TsCodeUtils.mergeFragmentsPresorted(
                    headers,
                    '\n',
                  ),
                  TPL_CELLS: TsCodeUtils.mergeFragmentsPresorted(
                    [...cells, actionCellFragment],
                    '\n',
                  ),
                  TPL_ACTION_SIBLING_COMPONENTS:
                    TsCodeUtils.mergeFragmentsPresorted(
                      sortedActions.map((a) => a.siblingContent),
                    ),
                },
              }),
            );

            // Render list page
            const {
              childProps: tableProps,
              componentBody,
              routeLoader,
            } = renderDataLoaders(dataLoaders);

            const itemsQueryVariable = `${lowercaseFirstChar(itemsQueryName)}Query`;
            const itemsQuery: GraphQLOperation = {
              type: 'query',
              variableName: itemsQueryVariable,
              operationName: itemsQueryName,
              fields: [
                {
                  name: modelNameVariants.graphqlList,
                  fields: [{ type: 'spread', fragment: tableItemsFragment }],
                },
              ],
            };

            await builder.apply(
              typescriptFile.renderTemplateFile({
                id: `list-${modelId}`,
                template: ADMIN_ADMIN_CRUD_LIST_GENERATED.templates.listPage,
                destination: listPagePath,
                variables: {
                  TPL_COMPONENT_NAME: listPageComponentName,
                  TPL_ROUTE_PATH: quot(`${routeFilePath}/`),
                  TPL_ITEMS_QUERY: renderTadaOperation(itemsQuery, {
                    currentPath: listPagePath,
                  }),
                  TPL_ROUTE_PROPS: routeLoader
                    ? tsTemplate`loader: ${routeLoader}`
                    : '',
                  TPL_PAGE_TITLE: modelNameVariants.pluralTitle,
                  TPL_DATA_LOADERS: componentBody,
                  TPL_CREATE_BUTTON: disableCreate
                    ? tsCodeFragment('')
                    : tsCodeFragment(
                        `
            <div className="block">
            <Link to="${routePrefix}/new">
              <Button>
                <MdAdd />
                Create ${titleizeCamel(modelName)}
              </Button>
            </Link>
          </div>`,
                        [
                          tsImportBuilder(['Link']).from(
                            '@tanstack/react-router',
                          ),
                          tsImportBuilder(['MdAdd']).from('react-icons/md'),
                          reactComponentsImports.Button.declaration(),
                        ],
                      ),
                  TPL_TABLE_COMPONENT: TsCodeUtils.mergeFragmentsAsJsxElement(
                    tableComponentName,
                    tableProps,
                    [
                      TsCodeUtils.importBuilder([tableComponentName]).from(
                        tableComponentPath,
                      ),
                    ],
                  ),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
