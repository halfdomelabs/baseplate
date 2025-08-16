import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { notEmpty, quot } from '@baseplate-dev/utils';
import { kebabCase } from 'es-toolkit';
import { pluralize } from 'inflection';
import { z } from 'zod';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';
import { reactRoutesProvider } from '#src/providers/routes.js';
import { titleizeCamel } from '#src/utils/case.js';
import { mergeGraphQLFields } from '#src/writers/graphql/index.js';

import type { AdminCrudAction } from '../_providers/admin-crud-action-container.js';
import type { AdminCrudColumn } from '../_providers/admin-crud-column-container.js';
import type { DataLoader } from '../_providers/admin-loader.js';

import { adminCrudActionContainerProvider } from '../_providers/admin-crud-action-container.js';
import { adminCrudColumnContainerProvider } from '../_providers/admin-crud-column-container.js';
import { printDataLoaders } from '../_providers/admin-loader.js';
import { mergeAdminCrudDataDependencies } from '../_utils/data-loaders.js';
import { adminCrudQueriesProvider } from '../admin-crud-queries/index.js';
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
        adminCrudQueries: adminCrudQueriesProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        renderers: ADMIN_ADMIN_CRUD_LIST_GENERATED.renderers.provider,
      },
      exports: {
        adminCrudActionContainer: adminCrudActionContainerProvider.export(),
        adminCrudColumnContainer: adminCrudColumnContainerProvider.export(),
      },
      run({
        typescriptFile,
        adminCrudQueries,
        reactRoutes,
        reactComponentsImports,
        renderers,
      }) {
        const routePrefix = reactRoutes.getRoutePrefix();
        const routeFilePath = reactRoutes.getRouteFilePath();
        const actions: AdminCrudAction[] = [];
        const columns: AdminCrudColumn[] = [];
        const listPagePath = `${reactRoutes.getOutputRelativePath()}/index.tsx`;
        const tableComponentPath = `${reactRoutes.getOutputRelativePath()}/-components/${kebabCase(modelName)}-table.tsx`;
        const tableComponentName = `${modelName}Table`;

        const listInfo = adminCrudQueries.getListQueryHookInfo();

        return {
          providers: {
            adminCrudActionContainer: {
              addAction: (action) => actions.push(action),
              getModelName: () => modelName,
            },
            adminCrudColumnContainer: {
              addColumn: (input) => columns.push(input),
              getModelName: () => modelName,
            },
          },
          build: async (builder) => {
            const sortedActions = actions.sort((a, b) => a.order - b.order);
            const sortedColumns = columns.sort((a, b) => a.order - b.order);
            const dataDependencies = mergeAdminCrudDataDependencies(
              sortedColumns
                .flatMap((c) => c.display.dataDependencies)
                .filter(notEmpty),
            );

            for (const dep of dataDependencies) {
              if (dep.graphFragments)
                for (const frag of dep.graphFragments) {
                  adminCrudQueries.addFragment(frag);
                }
              if (dep.graphRoots)
                for (const root of dep.graphRoots) {
                  adminCrudQueries.addRoot(root);
                }
            }

            const inputLoaders = dataDependencies.map((d) => d.loader);

            const useQuery = TsCodeUtils.importFragment(
              'useQuery',
              '@apollo/client',
            );

            const listPageLoader: DataLoader = {
              loader: tsTemplate`const { data, error } = ${useQuery}(${listInfo.documentExpression});`,
              loaderErrorName: 'error',
              loaderValueName: 'data',
            };

            const loaderOutput = printDataLoaders(
              [listPageLoader, ...inputLoaders],
              reactComponentsImports,
            );

            adminCrudQueries.setRowFields(
              mergeGraphQLFields([
                { name: 'id' },
                ...sortedColumns.flatMap((c) => c.display.graphQLFields),
                ...sortedActions.flatMap((a) => a.graphQLFields ?? []),
              ]),
            );
            const tableLoaderExtraProps = dataDependencies
              .map(
                (d) =>
                  `${d.propName}={${d.propLoaderValueGetter(
                    d.loader.loaderValueName,
                  )}}`,
              )
              .join(' ');

            const listPageComponentName = `${modelName}ListPage`;
            await builder.apply(
              typescriptFile.renderTemplateFile({
                id: `list-${modelId}`,
                template: ADMIN_ADMIN_CRUD_LIST_GENERATED.templates.listPage,
                destination: listPagePath,
                variables: {
                  TPL_ROUTE_PATH: quot(`${routeFilePath}/`),
                  TPL_PAGE_NAME: listPageComponentName,
                  TPL_TITLE: `${titleizeCamel(modelName)} Management`,
                  TPL_TABLE_COMPONENT: tsCodeFragment(
                    `<${tableComponentName} items={data.${listInfo.fieldName}} ${tableLoaderExtraProps} />`,
                    TsCodeUtils.importBuilder([tableComponentName]).from(
                      tableComponentPath,
                    ),
                  ),
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
                          reactComponentsImports.ErrorableLoader.declaration(),
                        ],
                      ),
                  TPL_DATA_LOADER: loaderOutput.loader,
                  TPL_DATA_PARTS: loaderOutput.dataParts,
                  TPL_ERROR_PARTS: loaderOutput.errorParts,
                },
                importMapProviders: {
                  reactComponentsImports,
                },
              }),
            );

            const headers = [
              ...sortedColumns.map(
                (column) =>
                  tsTemplateWithImports(
                    reactComponentsImports.TableHead.declaration(),
                  )`<TableHead>${column.label}</TableHead>`,
              ),
              ...(sortedActions.length > 0
                ? [
                    tsTemplateWithImports(
                      reactComponentsImports.TableHead.declaration(),
                    )`<TableHead className="w-12">Actions</TableHead>`,
                  ]
                : []),
            ];
            const cells = sortedColumns.map(
              (column) =>
                tsTemplateWithImports(
                  reactComponentsImports.TableCell.declaration(),
                )`<TableCell>${column.display.content('item')}</TableCell>`,
            );
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

            await builder.apply(
              renderers.table.render({
                id: `table-${modelId}`,
                destination: tableComponentPath,
                variables: {
                  TPL_COMPONENT_NAME: tableComponentName,
                  TPL_ROW_FRAGMENT: adminCrudQueries.getRowFragmentExpression(),
                  TPL_HEADERS: TsCodeUtils.mergeFragmentsPresorted(
                    headers,
                    '\n',
                  ),
                  TPL_CELLS: TsCodeUtils.mergeFragmentsPresorted(
                    [...cells, actionCellFragment],
                    '\n',
                  ),
                  TPL_PLURAL_MODEL: titleizeCamel(pluralize(modelName)),
                  TPL_EXTRA_PROPS: TsCodeUtils.mergeFragmentsAsInterfaceContent(
                    Object.fromEntries(
                      dataDependencies.map((d): [string, TsCodeFragment] => [
                        d.propName,
                        d.propType,
                      ]),
                    ),
                  ),
                  TPL_DESTRUCTURED_PROPS: `{
                    items,
                    ${dataDependencies.map((d) => d.propName).join(',\n')}
                  }`,
                  TPL_ACTION_HOOKS: TsCodeUtils.mergeFragmentsPresorted(
                    sortedActions.map((a) => a.hookContent),
                  ),
                  TPL_ACTION_SIBLING_COMPONENTS:
                    TsCodeUtils.mergeFragmentsPresorted(
                      sortedActions.map((a) => a.siblingContent),
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
