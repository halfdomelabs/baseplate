import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { dasherize, underscore } from 'inflection';
import { z } from 'zod';

import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';
import { reactErrorProvider } from '@src/generators/core/react-error/index.js';
import { reactRoutesProvider } from '@src/providers/routes.js';
import { notEmpty } from '@src/utils/array.js';
import { lowerCaseFirst, titleizeCamel } from '@src/utils/case.js';
import { createRouteElement } from '@src/utils/routes.js';
import { mergeGraphQLFields } from '@src/writers/graphql/index.js';

import type { AdminCrudInput } from '../_providers/admin-crud-input-container.js';
import type { DataLoader } from '../_providers/admin-loader.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import { printDataLoaders } from '../_providers/admin-loader.js';
import { mergeAdminCrudDataDependencies } from '../_utils/data-loaders.js';
import { adminCrudQueriesProvider } from '../admin-crud-queries/admin-crud-queries.generator.js';

const descriptorSchema = z.object({
  modelName: z.string(),
  disableCreate: z.boolean().optional(),
});

export interface AdminCrudEmbeddedForm {
  name: string;
}

export interface AdminCrudEditProvider {
  getSchemaPath(): string;
  getSchemaImport(): string;
  getDirectoryBase(): string;
}

export const adminCrudEditProvider =
  createProviderType<AdminCrudEditProvider>('admin-crud-edit');

export const adminCrudEditGenerator = createGenerator({
  name: 'admin/admin-crud-edit',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelName,
  buildTasks: ({ modelName, disableCreate }) => ({
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        reactRoutes: reactRoutesProvider,
        adminCrudQueries: adminCrudQueriesProvider,
        reactComponents: reactComponentsProvider,
        reactError: reactErrorProvider,
      },
      exports: {
        adminCrudEdit: adminCrudEditProvider.export(),
        adminCrudInputContainer: adminCrudInputContainerProvider.export(),
      },
      run({
        typescript,
        adminCrudQueries,
        reactRoutes,
        reactComponents,
        reactError,
      }) {
        const [editSchemaImport, editSchemaPath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/edit/${lowerCaseFirst(
            dasherize(underscore(modelName)),
          )}-schema.ts`,
        );
        const editSchemaName = `${lowerCaseFirst(modelName)}EditFormSchema`;
        const editSchemaExpression = TypescriptCodeUtils.createExpression(
          editSchemaName,
          `import { ${editSchemaName} } from '${editSchemaImport}';`,
        );

        const formDataName = `${modelName}FormData`;
        const formDataExpression = TypescriptCodeUtils.createExpression(
          formDataName,
          `import { ${formDataName} } from '${editSchemaImport}';`,
        );

        const [editFormComponentImport, editFormComponentPath] =
          makeImportAndFilePath(
            `${reactRoutes.getDirectoryBase()}/edit/${modelName}EditForm.tsx`,
          );
        const editFormComponentName = `${modelName}EditForm`;
        const editFormComponentExpression = new TypescriptCodeExpression(
          editFormComponentName,
          `import ${editFormComponentName} from '${editFormComponentImport}';`,
        );

        const [editPageImport, editPagePath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/edit/edit.page.tsx`,
        );
        const editPageName = `${modelName}EditPage`;
        reactRoutes.registerRoute({
          path: ':id/edit',
          element: createRouteElement(editPageName, editPageImport),
        });

        const [createPageImport, createPagePath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/edit/create.page.tsx`,
        );
        const createPageName = `${modelName}CreatePage`;

        const editQueryInfo = adminCrudQueries.getEditQueryHookInfo();
        const updateInfo = adminCrudQueries.getUpdateHookInfo();

        const inputFields: AdminCrudInput[] = [];

        return {
          providers: {
            adminCrudEdit: {
              getDirectoryBase: () => `${reactRoutes.getDirectoryBase()}/edit`,
              getSchemaPath: () => editSchemaPath,
              getSchemaImport: () => editSchemaImport,
            },
            adminCrudInputContainer: {
              addInput: (input) => {
                inputFields.push(input);
              },
              getModelName: () => modelName,
              isInModal: () => false,
            },
          },
          build: async (builder) => {
            adminCrudQueries.setFormFields(
              mergeGraphQLFields([
                { name: 'id' },
                ...inputFields.flatMap((c) => c.graphQLFields),
              ]),
            );

            const dataDependencies = mergeAdminCrudDataDependencies(
              inputFields.flatMap((f) => f.dataDependencies ?? []),
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

            const validations = inputFields.flatMap((c) => c.validation);
            const schemaPage = typescript.createTemplate({
              SCHEMA_NAME: new TypescriptStringReplacement(editSchemaName),
              SCHEMA_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
                Object.fromEntries(
                  validations.map((v) => [v.key, v.expression]),
                ),
              ),
              FORM_DATA_NAME: new TypescriptStringReplacement(formDataName),
            });
            await builder.apply(
              schemaPage.renderToAction('schema.ts', editSchemaPath),
            );

            const editFormPage = typescript.createTemplate(
              {
                COMPONENT_NAME: new TypescriptStringReplacement(
                  editFormComponentName,
                ),
                FORM_DATA_NAME: formDataExpression,
                EDIT_SCHEMA: editSchemaExpression,
                INPUTS: TypescriptCodeUtils.mergeExpressions(
                  inputFields.map((input) => input.content),
                  '\n',
                ),
                HEADER: TypescriptCodeUtils.mergeBlocks(
                  inputFields.map((field) => field.header).filter(notEmpty),
                ),
                EXTRA_PROPS: TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
                  Object.fromEntries(
                    dataDependencies.map(
                      (d): [string, TypescriptCodeExpression] => [
                        d.propName,
                        d.propType,
                      ],
                    ),
                  ),
                ),
                'EXTRA_PROP_SPREAD,': new TypescriptStringReplacement(
                  dataDependencies.map((d) => d.propName).join(',\n'),
                ),
              },
              {
                importMappers: [reactComponents, reactError],
              },
            );
            await builder.apply(
              editFormPage.renderToAction(
                'EditForm.tsx',
                editFormComponentPath,
              ),
            );

            const inputLoaders = inputFields.flatMap(
              (field) => field.dataDependencies?.map((d) => d.loader) ?? [],
            );

            const inputLoaderExtraProps = inputFields
              .flatMap((field) =>
                field.dataDependencies?.map(
                  (d) =>
                    `${d.propName}={${d.propLoaderValueGetter(
                      d.loader.loaderValueName,
                    )}}`,
                ),
              )
              .join(' ');

            const createLoaderOutput = printDataLoaders(
              inputLoaders,
              reactComponents,
            );

            if (!disableCreate) {
              const createInfo = adminCrudQueries.getCreateHookInfo();
              const createPage = typescript.createTemplate(
                {
                  COMPONENT_NAME: new TypescriptStringReplacement(
                    createPageName,
                  ),
                  EDIT_FORM: editFormComponentExpression.wrap(
                    (content) =>
                      `<${content} submitData={submitData} ${inputLoaderExtraProps} />`,
                  ),
                  CREATE_MUTATION: createInfo.hookExpression,
                  MUTATION_NAME: new TypescriptStringReplacement(
                    createInfo.fieldName,
                  ),
                  FORM_DATA_NAME: formDataExpression,
                  MODEL_NAME: new TypescriptStringReplacement(
                    titleizeCamel(modelName),
                  ),
                  REFETCH_DOCUMENT:
                    adminCrudQueries.getListDocumentExpression(),
                  DATA_LOADER: createLoaderOutput.loader,
                  DATA_GATE: createLoaderOutput.gate,
                },
                {
                  importMappers: [reactComponents, reactError],
                },
              );
              await builder.apply(
                createPage.renderToAction('create.page.tsx', createPagePath),
              );

              reactRoutes.registerRoute({
                path: 'new',
                element: createRouteElement(createPageName, createPageImport),
              });
            }

            const editPageLoader: DataLoader = {
              loader: TypescriptCodeUtils.formatBlock(
                `
          const { data, error } = GET_EDIT_BY_ID_QUERY({
            variables: { id },
          });
        
          const initialData: FORM_DATA_NAME | undefined = useMemo(() => {
            if (!data?.QUERY_FIELD_NAME) return undefined;
            return data.QUERY_FIELD_NAME;
          }, [data]);
          `,
                {
                  GET_EDIT_BY_ID_QUERY: editQueryInfo.hookExpression,
                  FORM_DATA_NAME: formDataExpression,
                  QUERY_FIELD_NAME: editQueryInfo.fieldName,
                },
                {
                  importText: ['import {useMemo} from "react"'],
                },
              ),
              loaderErrorName: 'error',
              loaderValueName: 'initialData',
            };

            const editPageLoaderOutput = printDataLoaders(
              [editPageLoader, ...inputLoaders],
              reactComponents,
            );

            const editPage = typescript.createTemplate(
              {
                COMPONENT_NAME: new TypescriptStringReplacement(editPageName),
                EDIT_FORM: editFormComponentExpression.wrap(
                  (content) =>
                    `<${content} submitData={submitData} initialData={initialData} ${inputLoaderExtraProps} />`,
                ),
                UPDATE_MUTATION: updateInfo.hookExpression,
                MUTATION_NAME: new TypescriptStringReplacement(
                  updateInfo.fieldName,
                ),
                FORM_DATA_NAME: formDataExpression,
                MODEL_NAME: new TypescriptStringReplacement(
                  titleizeCamel(modelName),
                ),
                DATA_LOADER: editPageLoaderOutput.loader,
                DATA_GATE: editPageLoaderOutput.gate,
              },
              {
                importMappers: [reactComponents, reactError],
              },
            );
            await builder.apply(
              editPage.renderToAction('edit.page.tsx', editPagePath),
            );
          },
        };
      },
    }),
  }),
});
