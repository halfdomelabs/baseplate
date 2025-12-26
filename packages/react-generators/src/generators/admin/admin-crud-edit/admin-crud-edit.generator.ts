import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { notEmpty, quot } from '@baseplate-dev/utils';
import { kebabCase, sortBy } from 'es-toolkit';
import { dasherize, pluralize, underscore } from 'inflection';
import { z } from 'zod';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';
import { reactRoutesProvider } from '#src/providers/routes.js';
import { lowerCaseFirst, titleizeCamel } from '#src/utils/case.js';
import { mergeGraphQLFields } from '#src/writers/graphql/index.js';

import type { AdminCrudInput } from '../_providers/admin-crud-input-container.js';
import type { DataLoader } from '../_providers/admin-loader.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import { printDataLoaders } from '../_providers/admin-loader.js';
import { mergeAdminCrudDataDependencies } from '../_utils/data-loaders.js';
import { adminCrudQueriesProvider } from '../admin-crud-queries/index.js';
import { ADMIN_ADMIN_CRUD_EDIT_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  modelId: z.string(),
  modelName: z.string(),
  disableCreate: z.boolean().optional(),
  nameField: z.string(),
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
  buildTasks: ({ modelId, modelName, disableCreate, nameField }) => ({
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        reactRoutes: reactRoutesProvider,
        adminCrudQueries: adminCrudQueriesProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      exports: {
        adminCrudEdit: adminCrudEditProvider.export(),
        adminCrudInputContainer: adminCrudInputContainerProvider.export(),
      },
      run({
        adminCrudQueries,
        reactRoutes,
        reactComponentsImports,
        renderers,
      }) {
        const routeFilePath = reactRoutes.getRouteFilePath();
        const editSchemaPath = `${reactRoutes.getOutputRelativePath()}/-schemas/${lowerCaseFirst(
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

        const editFormComponentPath = `${reactRoutes.getOutputRelativePath()}/-components/${kebabCase(modelName)}-edit-form.tsx`;
        const editFormComponentName = `${modelName}EditForm`;
        const editFormComponentExpression = TsCodeUtils.importFragment(
          editFormComponentName,
          editFormComponentPath,
        );

        const editPagePath = `${reactRoutes.getOutputRelativePath()}/$id.tsx`;
        const editPageName = `${modelName}EditPage`;

        const createPagePath = `${reactRoutes.getOutputRelativePath()}/new.tsx`;
        const createPageName = `${modelName}CreatePage`;

        const routePath = `${reactRoutes.getOutputRelativePath()}/route.tsx`;

        const editQueryInfo = adminCrudQueries.getEditQueryHookInfo();
        const updateInfo = adminCrudQueries.getUpdateHookInfo();

        const inputFields: AdminCrudInput[] = [];

        return {
          providers: {
            adminCrudEdit: {
              getDirectoryBase: () => reactRoutes.getOutputRelativePath(),
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
              renderers.schema.render({
                id: `edit-schema-${modelId}`,
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
              renderers.editForm.render({
                id: `edit-form-${modelId}`,
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
                  TPL_LIST_ROUTE: reactRoutes.getRoutePrefix(),
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
                renderers.createPage.render({
                  id: `create-${modelId}`,
                  destination: createPagePath,
                  variables: {
                    TPL_ROUTE_PATH: quot(`${routeFilePath}/new`),
                    TPL_COMPONENT_NAME: createPageName,
                    TPL_EDIT_FORM: tsTemplate`<${editFormComponentExpression} submitData={submitData} ${inputLoaderExtraProps} />`,
                    TPL_CREATE_MUTATION: createInfo.documentExpression,
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
            }

            const editPageLoader: DataLoader = {
              loader: TsCodeUtils.formatFragment(
                `
          const { data, error } = useQuery(GET_EDIT_BY_ID_QUERY, {
            variables: { id },
          });
        
          const initialData: FORM_DATA_NAME | undefined = useMemo(() => {
            if (!data?.QUERY_FIELD_NAME) return undefined;
            return data.QUERY_FIELD_NAME;
          }, [data]);
          `,
                {
                  GET_EDIT_BY_ID_QUERY: editQueryInfo.documentExpression,
                  FORM_DATA_NAME: formDataExpression,
                  QUERY_FIELD_NAME: editQueryInfo.fieldName,
                },
                [
                  tsImportBuilder(['useMemo']).from('react'),
                  tsImportBuilder(['useQuery']).from('@apollo/client/react'),
                ],
              ),
              loaderErrorName: 'error',
              loaderValueName: 'initialData',
            };

            const editPageLoaderOutput = printDataLoaders(
              [editPageLoader, ...inputLoaders],
              reactComponentsImports,
            );

            const nameFieldExpression = `data.${editQueryInfo.fieldName}.${nameField}`;
            const modelNameExpression = titleizeCamel(modelName);
            const crumbExpression = `${nameFieldExpression} ? ${nameFieldExpression} : 'Unnamed ${modelNameExpression}'`;

            await builder.apply(
              renderers.editPage.render({
                id: `edit-${modelId}`,
                destination: editPagePath,
                variables: {
                  TPL_ROUTE_PATH: quot(`${routeFilePath}/$id`),
                  TPL_COMPONENT_NAME: editPageName,
                  TPL_EDIT_FORM: tsTemplate`<${editFormComponentExpression} submitData={submitData} initialData={initialData} ${inputLoaderExtraProps} />`,
                  TPL_UPDATE_MUTATION: updateInfo.documentExpression,
                  TPL_MUTATION_NAME: updateInfo.fieldName,
                  TPL_FORM_DATA_NAME: formDataExpression,
                  TPL_DATA_LOADER: editPageLoaderOutput.loader,
                  TPL_DATA_GATE: editPageLoaderOutput.gate,
                  TPL_CRUMB_EXPRESSION: crumbExpression,
                  TPL_USER_QUERY: editQueryInfo.documentExpression,
                },
              }),
            );

            await builder.apply(
              renderers.route.render({
                id: `route-${modelId}`,
                destination: routePath,
                variables: {
                  TPL_ROUTE: quot(routeFilePath),
                  TPL_CRUMB: quot(pluralize(titleizeCamel(modelName))),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
