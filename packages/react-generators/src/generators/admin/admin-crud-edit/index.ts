import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createGeneratorWithTasks,
  createProviderType,
} from '@baseplate/sync';
import { dasherize, underscore } from 'inflection';
import _ from 'lodash';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactErrorProvider } from '@src/generators/core/react-error';
import {
  reactRoutesProvider,
  reactRoutesReadOnlyProvider,
} from '@src/providers/routes';
import { notEmpty } from '@src/utils/array';
import { humanizeCamel, lowerCaseFirst } from '@src/utils/case';
import { createRouteElement } from '@src/utils/routes';
import { mergeGraphQLFields } from '@src/writers/graphql';
import {
  AdminCrudInput,
  adminCrudInputContainerProvider,
} from '../_providers/admin-crud-input-container';
import { DataLoader, printDataLoaders } from '../_providers/admin-loader';
import { adminCrudQueriesProvider } from '../admin-crud-queries';

const descriptorSchema = z.object({
  modelName: z.string(),
  disableCreate: z.boolean().optional(),
});

export interface AdminCrudEmbeddedForm {
  name: string;
}

export interface AdminCrudEditProvider {
  getSchemaPath(): string;
  getDirectoryBase(): string;
}

export const adminCrudEditProvider =
  createProviderType<AdminCrudEditProvider>('admin-crud-edit');

const AdminCrudEditGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    inputs: {
      isMultiple: true,
    },
  }),
  buildTasks(taskBuilder, { modelName, disableCreate }) {
    taskBuilder.addTask({
      name: 'main',

      dependencies: {
        typescript: typescriptProvider,
        reactRoutes: reactRoutesProvider,
        adminCrudQueries: adminCrudQueriesProvider,
        reactComponents: reactComponentsProvider,
        reactError: reactErrorProvider,
      },
      exports: {
        adminCrudEdit: adminCrudEditProvider,
        adminCrudInputContainer: adminCrudInputContainerProvider,
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
            dasherize(underscore(modelName))
          )}-schema.ts`
        );
        const editSchemaName = `${lowerCaseFirst(modelName)}EditFormSchema`;
        const editSchemaExpression = TypescriptCodeUtils.createExpression(
          editSchemaName,
          `import { ${editSchemaName} } from '${editSchemaImport}';`
        );

        const formDataName = `${modelName}FormData`;
        const formDataExpression = TypescriptCodeUtils.createExpression(
          formDataName,
          `import { ${formDataName} } from '${editSchemaImport}';`
        );

        const [editFormComponentImport, editFormComponentPath] =
          makeImportAndFilePath(
            `${reactRoutes.getDirectoryBase()}/edit/${modelName}EditForm.tsx`
          );
        const editFormComponentName = `${modelName}EditForm`;
        const editFormComponentExpression = new TypescriptCodeExpression(
          editFormComponentName,
          `import ${editFormComponentName} from '${editFormComponentImport}';`
        );

        const [editPageImport, editPagePath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/edit/edit.page.tsx`
        );
        const editPageName = `${modelName}EditPage`;
        reactRoutes.registerRoute({
          path: ':id/edit',
          element: createRouteElement(editPageName, editPageImport),
        });

        const [createPageImport, createPagePath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/edit/create.page.tsx`
        );
        const createPageName = `${modelName}CreatePage`;

        const editQueryInfo = adminCrudQueries.getEditQueryHookInfo();
        const createInfo = adminCrudQueries.getCreateHookInfo();
        const updateInfo = adminCrudQueries.getUpdateHookInfo();

        const inputFields: AdminCrudInput[] = [];

        return {
          getProviders: () => ({
            adminCrudEdit: {
              getDirectoryBase: () => `${reactRoutes.getDirectoryBase()}/edit`,
              getSchemaPath: () => editSchemaPath,
            },
            adminCrudInputContainer: {
              addInput: (input) => {
                inputFields.push(input);
              },
              getModelName: () => modelName,
            },
          }),
          build: async (builder) => {
            adminCrudQueries.setFormFields(
              mergeGraphQLFields([
                { name: 'id' },
                ...inputFields.flatMap((c) => c.graphQLFields),
              ])
            );

            const dataDependencies = inputFields.flatMap(
              (f) => f.dataDependencies || []
            );

            dataDependencies.forEach((dep) => {
              dep.graphFragments?.forEach((frag) => {
                adminCrudQueries.addFragment(frag);
              });
              dep.graphRoots?.forEach((root) => {
                adminCrudQueries.addRoot(root);
              });
            });

            const validations = inputFields.flatMap((c) => c.validation);
            const schemaPage = typescript.createTemplate({
              SCHEMA_NAME: new TypescriptStringReplacement(editSchemaName),
              SCHEMA_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
                _.zipObject(
                  validations.map((v) => v.key),
                  validations.map((v) => v.expression)
                )
              ),
              FORM_DATA_NAME: new TypescriptStringReplacement(formDataName),
            });
            await builder.apply(
              schemaPage.renderToAction('schema.ts', editSchemaPath)
            );

            const editFormPage = typescript.createTemplate(
              {
                COMPONENT_NAME: new TypescriptStringReplacement(
                  editFormComponentName
                ),
                FORM_DATA_NAME: formDataExpression,
                EDIT_SCHEMA: editSchemaExpression,
                INPUTS: TypescriptCodeUtils.mergeExpressions(
                  inputFields.map((input) => input.content),
                  '\n'
                ),
                HEADER: TypescriptCodeUtils.mergeBlocks(
                  inputFields.map((field) => field.header).filter(notEmpty)
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
              editFormPage.renderToAction('EditForm.tsx', editFormComponentPath)
            );

            const inputLoaders = inputFields.flatMap(
              (field) => field.dataDependencies?.map((d) => d.loader) || []
            );

            const inputLoaderExtraProps = inputFields
              .flatMap((field) =>
                field.dataDependencies?.map(
                  (d) =>
                    `${d.propName}={${d.propLoaderValueGetter(
                      d.loader.loaderValueName
                    )}}`
                )
              )
              .join(' ');

            const createLoaderOutput = printDataLoaders(
              inputLoaders,
              reactComponents
            );

            if (!disableCreate) {
              const createPage = typescript.createTemplate(
                {
                  COMPONENT_NAME: new TypescriptStringReplacement(
                    createPageName
                  ),
                  EDIT_FORM: editFormComponentExpression.wrap(
                    (content) =>
                      `<${content} submitData={submitData} ${inputLoaderExtraProps} />`
                  ),
                  CREATE_MUTATION: createInfo.hookExpression,
                  MUTATION_NAME: new TypescriptStringReplacement(
                    createInfo.fieldName
                  ),
                  FORM_DATA_NAME: formDataExpression,
                  MODEL_NAME: new TypescriptStringReplacement(
                    humanizeCamel(modelName)
                  ),
                  REFETCH_DOCUMENT:
                    adminCrudQueries.getListDocumentExpression(),
                  DATA_LOADER: createLoaderOutput.loader,
                  DATA_GATE: createLoaderOutput.gate,
                },
                {
                  importMappers: [reactComponents, reactError],
                }
              );
              await builder.apply(
                createPage.renderToAction('create.page.tsx', createPagePath)
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
                }
              ),
              loaderErrorName: 'error',
              loaderValueName: 'initialData',
            };

            const editPageLoaderOutput = printDataLoaders(
              [editPageLoader, ...inputLoaders],
              reactComponents
            );

            const editPage = typescript.createTemplate(
              {
                COMPONENT_NAME: new TypescriptStringReplacement(editPageName),
                EDIT_FORM: editFormComponentExpression.wrap(
                  (content) =>
                    `<${content} submitData={submitData} initialData={initialData} ${inputLoaderExtraProps} />`
                ),
                UPDATE_MUTATION: updateInfo.hookExpression,
                MUTATION_NAME: new TypescriptStringReplacement(
                  updateInfo.fieldName
                ),
                FORM_DATA_NAME: formDataExpression,
                MODEL_NAME: new TypescriptStringReplacement(
                  humanizeCamel(modelName)
                ),
                DATA_LOADER: editPageLoaderOutput.loader,
                DATA_GATE: editPageLoaderOutput.gate,
              },
              {
                importMappers: [reactComponents, reactError],
              }
            );
            await builder.apply(
              editPage.renderToAction('edit.page.tsx', editPagePath)
            );
          },
        };
      },
    });
  },
});

export default AdminCrudEditGenerator;
