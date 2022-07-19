import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { pluralize } from 'inflection';
import _ from 'lodash';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactErrorProvider } from '@src/generators/core/react-error';
import { reactRoutesProvider } from '@src/providers/routes';
import { notEmpty } from '@src/utils/array';
import { titleizeCamel } from '@src/utils/case';
import { createRouteElement } from '@src/utils/routes';
import { mergeGraphQLFields } from '@src/writers/graphql';
import {
  AdminCrudColumn,
  adminCrudColumnContainerProvider,
} from '../_providers/admin-crud-column-container';
import { DataLoader, printDataLoaders } from '../_providers/admin-loader';
import { mergeAdminCrudDataDependencies } from '../_utils/data-loaders';
import { adminCrudQueriesProvider } from '../admin-crud-queries';

const descriptorSchema = z.object({
  modelName: z.string(),
  disableCreate: z.boolean().optional(),
});

const AdminCrudListGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    columns: {
      isMultiple: true,
      defaultDescriptor: {
        generator: '@baseplate/react/admin/admin-crud-column',
      },
    },
  }),
  dependencies: {
    typescript: typescriptProvider,
    reactRoutes: reactRoutesProvider,
    adminCrudQueries: adminCrudQueriesProvider,
    reactComponents: reactComponentsProvider,
    reactError: reactErrorProvider,
  },
  exports: {
    adminCrudColumnContainer: adminCrudColumnContainerProvider,
  },
  createGenerator(
    { modelName, disableCreate },
    { typescript, adminCrudQueries, reactRoutes, reactComponents, reactError }
  ) {
    const columns: AdminCrudColumn[] = [];
    const [listPageImport, listPagePath] = makeImportAndFilePath(
      `${reactRoutes.getDirectoryBase()}/list/index.page.tsx`
    );
    const [tableComponentImport, tableComponentPath] = makeImportAndFilePath(
      `${reactRoutes.getDirectoryBase()}/list/${modelName}Table.tsx`
    );
    const tableComponentName = `${modelName}Table`;

    const listInfo = adminCrudQueries.getListQueryHookInfo();
    const deleteInfo = adminCrudQueries.getDeleteHookInfo();

    return {
      getProviders: () => ({
        adminCrudColumnContainer: {
          addColumn: (input) => columns.push(input),
          getModelName: () => modelName,
        },
      }),
      build: async (builder) => {
        const dataDependencies = mergeAdminCrudDataDependencies(
          columns.flatMap((c) => c.display.dataDependencies).filter(notEmpty)
        );

        const inputLoaders = dataDependencies.map((d) => d.loader);

        const listPageLoader: DataLoader = {
          loader: TypescriptCodeUtils.formatBlock(
            `const { data, error } = GET_ITEM_QUERY();`,
            { GET_ITEM_QUERY: listInfo.hookExpression }
          ),
          loaderErrorName: 'error',
          loaderValueName: 'data',
        };

        const loaderOutput = printDataLoaders(
          [listPageLoader, ...inputLoaders],
          reactComponents
        );

        adminCrudQueries.setRowFields(
          mergeGraphQLFields([
            { name: 'id' },
            ...columns.flatMap((c) => c.display.graphQLFields),
          ])
        );

        const listPageComponentName = `${modelName}ListPage`;
        const listPage = typescript.createTemplate(
          {
            PAGE_NAME: new TypescriptStringReplacement(listPageComponentName),
            DELETE_FUNCTION: new TypescriptStringReplacement(
              deleteInfo.fieldName
            ),
            DELETE_MUTATION: deleteInfo.hookExpression,
            ROW_FRAGMENT_NAME: adminCrudQueries.getRowFragmentExpression(),
            PLURAL_MODEL: new TypescriptStringReplacement(
              titleizeCamel(pluralize(modelName))
            ),
            TABLE_COMPONENT: new TypescriptCodeExpression(
              `<${tableComponentName} deleteItem={handleDeleteItem} items={data.${listInfo.fieldName}} />`,
              `import ${tableComponentName} from '${tableComponentImport}'`
            ),
            REFETCH_DOCUMENT: adminCrudQueries.getListDocumentExpression(),
            CREATE_BUTTON: disableCreate
              ? TypescriptCodeUtils.createExpression('')
              : TypescriptCodeUtils.createExpression(
                  `
            <div className="block">
            <Link to="new">
              <Button>Create ${titleizeCamel(modelName)}</Button>
            </Link>
          </div>`,
                  [
                    "import { Link } from 'react-router-dom';",
                    "import { Button, ErrorableLoader } from '%react-components';",
                  ],
                  { importMappers: [reactComponents] }
                ),
            DATA_LOADER: loaderOutput.loader,
            DATA_PARTS: new TypescriptCodeExpression(loaderOutput.dataParts),
            ERROR_PARTS: new TypescriptCodeExpression(loaderOutput.errorParts),
          },
          {
            importMappers: [reactComponents, reactError],
          }
        );

        await builder.apply(
          listPage.renderToAction('index.page.tsx', listPagePath)
        );
        reactRoutes.registerRoute({
          index: true,
          element: createRouteElement(listPageComponentName, listPageImport),
        });

        const headers = columns.map((column) =>
          TypescriptCodeUtils.createExpression(
            `<Table.HeadCell>${column.label}</Table.HeadCell>`
          )
        );
        const cells = columns.map((column) =>
          column.display
            .content('item')
            .wrap((content) => `<Table.Cell>${content}</Table.Cell>`)
        );
        const tableComponent = typescript.createTemplate(
          {
            COMPONENT_NAME: new TypescriptStringReplacement(tableComponentName),
            ROW_FRAGMENT: adminCrudQueries.getRowFragmentExpression(),
            HEADERS: TypescriptCodeUtils.mergeExpressions(headers, '\n'),
            CELLS: TypescriptCodeUtils.mergeExpressions(cells, '\n'),
            PLURAL_MODEL: new TypescriptStringReplacement(
              titleizeCamel(pluralize(modelName))
            ),
            EXTRA_PROPS: TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
              _.fromPairs(
                dataDependencies.map(
                  (d): [string, TypescriptCodeExpression] => [
                    d.propName,
                    d.propType,
                  ]
                )
              )
            ),
            'EXTRA_PROP_SPREAD,': new TypescriptStringReplacement(
              dataDependencies.map((d) => d.propName).join(',\n')
            ),
          },
          {
            importMappers: [reactComponents, reactError],
          }
        );

        await builder.apply(
          tableComponent.renderToAction('Table.tsx', tableComponentPath)
        );
      },
    };
  },
});

export default AdminCrudListGenerator;
