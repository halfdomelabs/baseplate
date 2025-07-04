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
import { notEmpty } from '@baseplate-dev/utils';
import { kebabCase } from 'es-toolkit';
import { pluralize } from 'inflection';
import { z } from 'zod';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/index.js';
import { reactRoutesProvider } from '#src/providers/routes.js';
import { titleizeCamel } from '#src/utils/case.js';
import { createRouteElement } from '#src/utils/routes.js';
import { mergeGraphQLFields } from '#src/writers/graphql/index.js';

import type { AdminCrudColumn } from '../_providers/admin-crud-column-container.js';
import type { DataLoader } from '../_providers/admin-loader.js';

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
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactRoutes: reactRoutesProvider,
        adminCrudQueries: adminCrudQueriesProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        reactErrorImports: reactErrorImportsProvider,
      },
      exports: {
        adminCrudColumnContainer: adminCrudColumnContainerProvider.export(),
      },
      run({
        typescriptFile,
        adminCrudQueries,
        reactRoutes,
        reactComponentsImports,
        reactErrorImports,
      }) {
        const columns: AdminCrudColumn[] = [];
        const listPagePath = `${reactRoutes.getDirectoryBase()}/index.tsx`;
        const tableComponentPath = `${reactRoutes.getDirectoryBase()}/-components/${kebabCase(modelName)}-table.tsx`;
        const tableComponentName = `${modelName}Table`;

        const listInfo = adminCrudQueries.getListQueryHookInfo();
        const deleteInfo = adminCrudQueries.getDeleteHookInfo();

        return {
          providers: {
            adminCrudColumnContainer: {
              addColumn: (input) => columns.push(input),
              getModelName: () => modelName,
            },
          },
          build: async (builder) => {
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

            const listPageLoader: DataLoader = {
              loader: tsTemplate`const { data, error } = ${listInfo.hookExpression}();`,
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
                  TPL_PAGE_NAME: listPageComponentName,
                  TPL_DELETE_FUNCTION: deleteInfo.fieldName,
                  TPL_DELETE_MUTATION: deleteInfo.hookExpression,
                  TPL_ROW_FRAGMENT_NAME:
                    adminCrudQueries.getRowFragmentExpression(),
                  TPL_PLURAL_MODEL: titleizeCamel(pluralize(modelName)),
                  TPL_TABLE_COMPONENT: tsCodeFragment(
                    `<${tableComponentName} deleteItem={handleDeleteItem} items={data.${listInfo.fieldName}} ${tableLoaderExtraProps} />`,
                    TsCodeUtils.importBuilder([tableComponentName]).from(
                      tableComponentPath,
                    ),
                  ),
                  TPL_REFETCH_DOCUMENT:
                    adminCrudQueries.getListDocumentExpression(),
                  TPL_CREATE_BUTTON: disableCreate
                    ? tsCodeFragment('')
                    : tsCodeFragment(
                        `
            <div className="block">
            <Link to="new">
              <Button>Create ${titleizeCamel(modelName)}</Button>
            </Link>
          </div>`,
                        [
                          tsImportBuilder(['Link']).from('react-router-dom'),
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

            reactRoutes.registerRoute({
              index: true,
              element: createRouteElement(listPageComponentName, listPagePath),
            });

            const headers = sortedColumns.map(
              (column) =>
                tsTemplateWithImports(
                  reactComponentsImports.TableHead.declaration(),
                )`<TableHead>${column.label}</TableHead>`,
            );
            const cells = sortedColumns.map(
              (column) =>
                tsTemplateWithImports(
                  reactComponentsImports.TableCell.declaration(),
                )`<TableCell>${column.display.content('item')}</TableCell>`,
            );
            await builder.apply(
              typescriptFile.renderTemplateFile({
                id: `table-${modelId}`,
                template: ADMIN_ADMIN_CRUD_LIST_GENERATED.templates.table,
                destination: tableComponentPath,
                variables: {
                  TPL_COMPONENT_NAME: tableComponentName,
                  TPL_ROW_FRAGMENT: adminCrudQueries.getRowFragmentExpression(),
                  TPL_HEADERS: TsCodeUtils.mergeFragmentsPresorted(
                    headers,
                    '\n',
                  ),
                  TPL_CELLS: TsCodeUtils.mergeFragmentsPresorted(cells, '\n'),
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
                    deleteItem,
                    ${dataDependencies.map((d) => d.propName).join(',\n')}
                  }`,
                },
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
