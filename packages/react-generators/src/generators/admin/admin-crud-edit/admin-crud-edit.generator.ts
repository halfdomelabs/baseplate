import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { notEmpty, quot } from '@baseplate-dev/utils';
import { kebabCase, sortBy } from 'es-toolkit';
import { dasherize, underscore } from 'inflection';
import { z } from 'zod';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/index.js';
import { reactRoutesProvider } from '#src/providers/routes.js';
import { lowerCaseFirst, titleizeCamel } from '#src/utils/case.js';
import { createRouteElement } from '#src/utils/routes.js';
import { mergeGraphQLFields } from '#src/writers/graphql/index.js';

import type { AdminCrudInput } from '../_providers/admin-crud-input-container.js';
import type { DataLoader } from '../_providers/admin-loader.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import { printDataLoaders } from '../_providers/admin-loader.js';
import { mergeAdminCrudDataDependencies } from '../_utils/data-loaders.js';
import { adminCrudQueriesProvider } from '../admin-crud-queries/index.js';
import { ADMIN_ADMIN_CRUD_EDIT_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  modelId: z.string(),
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
        adminCrudEdit: adminCrudEditProvider.export(),
        adminCrudInputContainer: adminCrudInputContainerProvider.export(),
      },
      run({
        typescriptFile,
        adminCrudQueries,
        reactRoutes,
        reactComponentsImports,
        reactErrorImports,
      }) {
        const routePrefix = reactRoutes.getRoutePrefix();
        const editSchemaPath = `${reactRoutes.getDirectoryBase()}/-schemas/${lowerCaseFirst(
          dasherize(underscore(modelName)),
        )}-schema.ts`;

        const editSchemaName = `${lowerCaseFirst(modelName)}EditFormSchema`;
        const editSchemaExpression = TsCodeUtils.importFragment(
          editSchemaName,
          editSchemaPath,
        );

        const formDataName = `${modelName}FormData`;
        const formDataExpression = TsCodeUtils.typeImportFragment(
          formDataName,
          editSchemaPath,
        );

        const editFormComponentPath = `${reactRoutes.getDirectoryBase()}/-components/${kebabCase(modelName)}-edit-form.tsx`;
        const editFormComponentName = `${modelName}EditForm`;
        const editFormComponentExpression = TsCodeUtils.importFragment(
          editFormComponentName,
          editFormComponentPath,
        );

        const editPagePath = `${reactRoutes.getDirectoryBase()}/$id.tsx`;
        const editPageName = `${modelName}EditPage`;
        reactRoutes.registerRoute({
          path: ':id/edit',
          element: createRouteElement(editPageName, editPagePath),
        });

        const createPagePath = `${reactRoutes.getDirectoryBase()}/new.tsx`;
        const createPageName = `${modelName}CreatePage`;

        const editQueryInfo = adminCrudQueries.getEditQueryHookInfo();
        const updateInfo = adminCrudQueries.getUpdateHookInfo();

        const inputFields: AdminCrudInput[] = [];

        return {
          providers: {
            adminCrudEdit: {
              getDirectoryBase: () => reactRoutes.getDirectoryBase(),
              getSchemaPath: () => editSchemaPath,
              getSchemaImport: () => editSchemaPath,
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
            await builder.apply(
              typescriptFile.renderTemplateFile({
                id: `edit-schema-${modelId}`,
                template: ADMIN_ADMIN_CRUD_EDIT_GENERATED.templates.schema,
                destination: editSchemaPath,
                variables: {
                  TPL_SCHEMA_NAME: editSchemaName,
                  TPL_SCHEMA_OBJECT: TsCodeUtils.mergeFragmentsAsObject(
                    Object.fromEntries(
                      validations.map((v) => [v.key, v.expression]),
                    ),
                  ),
                  TPL_FORM_DATA_NAME: formDataName,
                },
              }),
            );

            const sortedInputs = sortBy(inputFields, [(i) => i.order]);
            await builder.apply(
              typescriptFile.renderTemplateFile({
                id: `edit-form-${modelId}`,
                template: ADMIN_ADMIN_CRUD_EDIT_GENERATED.templates.editForm,
                destination: editFormComponentPath,
                variables: {
                  TPL_COMPONENT_NAME: editFormComponentName,
                  TPL_FORM_DATA_NAME: formDataExpression,
                  TPL_EDIT_SCHEMA: editSchemaExpression,
                  TPL_INPUTS: TsCodeUtils.mergeFragmentsPresorted(
                    sortedInputs.map((input) => input.content),
                    '\n',
                  ),
                  TPL_HEADER: TsCodeUtils.mergeFragmentsPresorted(
                    sortedInputs.map((input) => input.header).filter(notEmpty),
                    '\n',
                  ),
                  TPL_EXTRA_PROPS: TsCodeUtils.mergeFragmentsAsInterfaceContent(
                    Object.fromEntries(
                      dataDependencies.map((d): [string, TsCodeFragment] => [
                        d.propName,
                        d.propType,
                      ]),
                    ),
                  ),
                  TPL_DESTRUCTURED_PROPS: `{
                    className,
                    initialData,
                    submitData,
                    ${dataDependencies.map((d) => d.propName).join(',\n')}
                  }`,
                },
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
              }),
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
              reactComponentsImports,
            );

            if (!disableCreate) {
              const createInfo = adminCrudQueries.getCreateHookInfo();
              await builder.apply(
                typescriptFile.renderTemplateFile({
                  id: `create-${modelId}`,
                  template:
                    ADMIN_ADMIN_CRUD_EDIT_GENERATED.templates.createPage,
                  destination: createPagePath,
                  importMapProviders: {
                    reactErrorImports,
                  },
                  variables: {
                    TPL_ROUTE_VALUE: quot(`${routePrefix}/new`),
                    TPL_COMPONENT_NAME: createPageName,
                    TPL_EDIT_FORM: tsTemplate`<${editFormComponentExpression} submitData={submitData} ${inputLoaderExtraProps} />`,
                    TPL_CREATE_MUTATION: createInfo.hookExpression,
                    TPL_MUTATION_NAME: createInfo.fieldName,
                    TPL_FORM_DATA_NAME: formDataExpression,
                    TPL_MODEL_NAME: titleizeCamel(modelName),
                    TPL_REFETCH_DOCUMENT:
                      adminCrudQueries.getListDocumentExpression(),
                    TPL_DATA_LOADER: createLoaderOutput.loader,
                    TPL_DATA_GATE: createLoaderOutput.gate,
                  },
                }),
              );

              reactRoutes.registerRoute({
                path: 'new',
                element: createRouteElement(createPageName, createPagePath),
              });
            }

            const editPageLoader: DataLoader = {
              loader: TsCodeUtils.formatFragment(
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
                tsImportBuilder(['useMemo']).from('react'),
              ),
              loaderErrorName: 'error',
              loaderValueName: 'initialData',
            };

            const editPageLoaderOutput = printDataLoaders(
              [editPageLoader, ...inputLoaders],
              reactComponentsImports,
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                id: `edit-${modelId}`,
                template: ADMIN_ADMIN_CRUD_EDIT_GENERATED.templates.editPage,
                destination: editPagePath,
                variables: {
                  TPL_ROUTE_VALUE: quot(`${routePrefix}/$id`),
                  TPL_COMPONENT_NAME: editPageName,
                  TPL_EDIT_FORM: tsTemplate`<${editFormComponentExpression} submitData={submitData} initialData={initialData} ${inputLoaderExtraProps} />`,
                  TPL_UPDATE_MUTATION: updateInfo.hookExpression,
                  TPL_MUTATION_NAME: updateInfo.fieldName,
                  TPL_FORM_DATA_NAME: formDataExpression,
                  TPL_MODEL_NAME: titleizeCamel(modelName),
                  TPL_DATA_LOADER: editPageLoaderOutput.loader,
                  TPL_DATA_GATE: editPageLoaderOutput.gate,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
