import {
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import {
  lowercaseFirstChar,
  notEmpty,
  quot,
  uppercaseFirstChar,
} from '@baseplate-dev/utils';
import { kebabCase, sortBy } from 'es-toolkit';
import { dasherize, pluralize, underscore } from 'inflection';
import { z } from 'zod';

import type {
  GraphQLFragment,
  GraphQLOperation,
} from '#src/writers/graphql/index.js';

import { graphqlImportsProvider } from '#src/generators/apollo/index.js';
import { reactRoutesProvider } from '#src/providers/routes.js';
import { lowerCaseFirst, titleizeCamel } from '#src/utils/case.js';
import {
  mergeGraphqlFields,
  renderTadaFragment,
  renderTadaOperation,
} from '#src/writers/graphql/index.js';

import type { AdminCrudInput } from '../_providers/admin-crud-input-container.js';
import type { DataLoader, RouteLoaderField } from '../_utils/data-loader.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import { renderDataLoaders } from '../_utils/data-loader.js';
import { getModelNameVariants } from '../_utils/get-model-name-variants.js';
import { ADMIN_ADMIN_CRUD_EDIT_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  modelId: z.string(),
  modelName: z.string(),
  disableCreate: z.boolean().optional(),
  nameField: z.string(),
  idField: z.string(),
  idFieldGraphqlType: z.enum(['Uuid', 'String']),
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
  buildTasks: ({
    modelId,
    modelName,
    disableCreate,
    nameField,
    idField,
    idFieldGraphqlType,
  }) => ({
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        reactRoutes: reactRoutesProvider,
        graphqlImports: graphqlImportsProvider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      exports: {
        adminCrudEdit: adminCrudEditProvider.export(),
        adminCrudInputContainer: adminCrudInputContainerProvider.export(),
      },
      run({ reactRoutes, renderers, graphqlImports }) {
        const modelNameVariants = getModelNameVariants(modelName);
        const modelGraphqlById = modelNameVariants.graphqlById;
        const modelTitle = modelNameVariants.title;
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

        const editFormPrefix = `${modelNameVariants.pascal}EditForm`;
        const editFormDefaultValuesFragmentVariable = `${lowerCaseFirst(editFormPrefix)}DefaultValuesFragment`;
        const editFormDefaultValuesFragmentName = `${editFormPrefix}_defaultValues`;

        const editPagePrefix = `${modelNameVariants.pascal}EditPage`;

        const createPagePrefix = `${modelNameVariants.pascal}CreatePage`;

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
              getParentComponentName: () => editFormComponentName,
              getParentComponentPath: () => editFormComponentPath,
              isInModal: () => false,
            },
          },
          build: async (builder) => {
            // Data loaders
            const editPageLoader: DataLoader = {
              propName: 'defaultValues',
              routeLoaderFields: [
                {
                  key: 'queryRef',
                  value: tsTemplate`preloadQuery(${editFormDefaultValuesFragmentVariable})`,
                  contextFields: ['preloadQuery'],
                },
              ],
              propType: tsTemplate`${graphqlImports.FragmentOf.typeFragment()}<typeof ${editFormDefaultValuesFragmentVariable}> | undefined`,
              pageComponentBody: tsTemplateWithImports([
                tsImportBuilder(['useReadQuery']).from('@apollo/client/react'),
              ])`const { data } = useReadQuery(queryRef);`,
              propPageValue: tsTemplate`data.${editFormDefaultValuesFragmentVariable}`,
            };
            const dataLoaders = [
              editPageLoader,
              ...inputFields.flatMap((c) => c.dataLoaders ?? []),
            ];

            // Edit Form Schema
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

            // Edit Form
            const editFormDefaultValuesFragment: GraphQLFragment = {
              variableName: editFormDefaultValuesFragmentVariable,
              fragmentName: editFormDefaultValuesFragmentName,
              onType: modelNameVariants.graphqlObjectType,
              fields: mergeGraphqlFields([
                { name: idField },
                { name: nameField },
                ...inputFields.flatMap((c) => c.graphQLFields),
              ]),
              path: editFormComponentPath,
            };

            const sortedInputs = sortBy(inputFields, [(i) => i.order]);

            await builder.apply(
              renderers.editForm.render({
                id: `edit-form-${modelId}`,
                destination: editFormComponentPath,
                variables: {
                  TPL_COMPONENT_NAME: editFormComponentName,
                  TPL_FORM_DATA_NAME: formDataExpression,
                  TPL_LIST_ROUTE: reactRoutes.getRoutePrefix(),
                  TPL_EDIT_FRAGMENT: renderTadaFragment(
                    editFormDefaultValuesFragment,
                    { exported: true, currentPath: editFormComponentPath },
                  ),
                  TPL_PROPS: TsCodeUtils.mergeFragmentsAsInterfaceContent(
                    Object.fromEntries(
                      dataLoaders.map((d) => [d.propName, d.propType]),
                    ),
                  ),
                  TPL_DESTRUCTURED_PROPS: `{
                    className,
                    submitData,
                    ${dataLoaders.map((d) => d.propName).join(',\n')}
                  }`,
                  TPL_EDIT_SCHEMA: editSchemaExpression,
                  TPL_HEADER: TsCodeUtils.mergeFragmentsPresorted(
                    sortedInputs.map((input) => input.header).filter(notEmpty),
                    '\n',
                  ),
                  TPL_INPUTS: TsCodeUtils.mergeFragmentsPresorted(
                    sortedInputs.map((input) => input.content),
                    '\n',
                  ),
                },
              }),
            );

            // Edit Page
            const editQueryVariable = `${lowercaseFirstChar(editPagePrefix)}Query`;
            const editQueryName = `${editPagePrefix}Query`;
            const editQuery: GraphQLOperation = {
              type: 'query',
              variableName: editQueryVariable,
              operationName: editQueryName,
              variables: [{ name: 'id', type: idFieldGraphqlType }],
              fields: [
                {
                  name: modelGraphqlById,
                  args: [
                    {
                      name: 'id',
                      value: { type: 'variable', variable: '$id' },
                    },
                  ],
                  fields: mergeGraphqlFields([
                    { name: idField },
                    { name: nameField },
                    {
                      type: 'spread',
                      fragment: editFormDefaultValuesFragment,
                    },
                  ]),
                },
              ],
            };

            const updateMutationVariable = `${lowercaseFirstChar(editPagePrefix)}Input`;
            const updateMutationName = `${editPagePrefix}Update`;
            const updateMutationFieldName = `update${modelNameVariants.pascal}`;
            const updateMutation: GraphQLOperation = {
              type: 'mutation',
              variableName: updateMutationVariable,
              operationName: updateMutationName,
              variables: [
                {
                  name: 'input',
                  type: `${uppercaseFirstChar(updateMutationFieldName)}Input!`,
                },
              ],
              fields: [
                {
                  name: updateMutationFieldName,
                  args: [
                    {
                      name: 'input',
                      value: { type: 'variable', variable: '$input' },
                    },
                  ],
                  fields: [
                    { name: idField },
                    { name: nameField },
                    { type: 'spread', fragment: editFormDefaultValuesFragment },
                  ],
                },
              ],
            };

            const defaultCrumbExpression = tsTemplate`${quot(`Edit ${modelTitle}`)}`;
            const crumbRouteLoaderField: RouteLoaderField = {
              key: 'crumb',
              value: tsTemplate`apolloClient
      .query({
        query: ${editQueryVariable},
        variables: { id },
      })
      .then(({ data }) => (data?.${modelGraphqlById}?.name ? data.${modelGraphqlById}.name : ${defaultCrumbExpression}))
      .catch(() => ${defaultCrumbExpression})`,
              contextFields: ['apolloClient'],
              paramsFields: ['id'],
            };
            const editPageRenderedLoaders = renderDataLoaders(
              [
                editPageLoader,
                ...inputFields.flatMap((c) => c.dataLoaders ?? []),
              ],
              [crumbRouteLoaderField],
            );

            await builder.apply(
              renderers.editPage.render({
                id: `edit-${modelId}`,
                destination: editPagePath,
                variables: {
                  TPL_COMPONENT_NAME: editPageName,
                  TPL_FORM_DATA_NAME: formDataExpression,
                  TPL_UPDATE_MUTATION_VARIABLE: updateMutationVariable,
                  TPL_UPDATE_MUTATION_NAME: updateMutationName,
                  TPL_ROUTE_PATH: quot(`${routeFilePath}/$id`),
                  TPL_EDIT_QUERY: renderTadaOperation(editQuery, {
                    currentPath: editPagePath,
                  }),
                  TPL_UPDATE_MUTATION: renderTadaOperation(updateMutation, {
                    currentPath: editPagePath,
                  }),
                  TPL_ROUTE_PROPS: editPageRenderedLoaders.routeLoader
                    ? tsTemplate`loader: ${editPageRenderedLoaders.routeLoader}`
                    : '',
                  TPL_DATA_LOADER: editPageRenderedLoaders.componentBody,
                  TPL_MUTATION_SUCCESS_MESSAGE: quot(
                    `Successfully updated ${modelNameVariants.lowercaseWords}!`,
                  ),
                  TPL_MUTATION_ERROR_MESSAGE: quot(
                    `Sorry, we could not update ${modelNameVariants.lowercaseWords}.`,
                  ),
                  TPL_EDIT_FORM: TsCodeUtils.mergeFragmentsAsJsxElement(
                    editFormComponentExpression,
                    {
                      submitData: 'submitData',
                      ...editPageRenderedLoaders.childProps,
                    },
                  ),
                },
              }),
            );

            if (!disableCreate) {
              const createMutationName = `${createPagePrefix}Create`;
              const createMutationVariable = `${lowercaseFirstChar(createPagePrefix)}CreateMutation`;
              const createMutationFieldName = `create${modelNameVariants.pascal}`;
              const createMutation: GraphQLOperation = {
                type: 'mutation',
                variableName: createMutationVariable,
                operationName: createMutationName,
                variables: [
                  {
                    name: 'input',
                    type: `${uppercaseFirstChar(createMutationFieldName)}Input!`,
                  },
                ],
                fields: [
                  {
                    name: createMutationFieldName,
                    args: [
                      {
                        name: 'input',
                        value: { type: 'variable', variable: '$input' },
                      },
                    ],
                    fields: [{ name: idField }],
                  },
                ],
              };
              const createPageRenderedLoaders = renderDataLoaders(
                inputFields.flatMap((c) => c.dataLoaders ?? []),
              );
              const componentMutationHook = tsTemplate`const [${createMutationFieldName}] = useMutation(${createMutationVariable}, {
                update: (cache) => {
                  cache.evict({ fieldName: '${modelNameVariants.graphqlList}' });
                  cache.gc();
                },
              });`;
              await builder.apply(
                renderers.createPage.render({
                  id: `create-${modelId}`,
                  destination: createPagePath,
                  variables: {
                    TPL_ROUTE_PATH: quot(`${routeFilePath}/new`),
                    TPL_COMPONENT_NAME: createPageName,
                    TPL_CREATE_MUTATION: renderTadaOperation(createMutation, {
                      currentPath: createPagePath,
                    }),
                    TPL_DATA_LOADER: createPageRenderedLoaders.componentBody,
                    TPL_MUTATION_HOOK: componentMutationHook,
                    TPL_FORM_DATA_NAME: formDataExpression,
                    TPL_MUTATION_SUCCESS_MESSAGE: quot(
                      `Successfully created ${modelNameVariants.lowercaseWords}!`,
                    ),
                    TPL_MUTATION_ERROR_MESSAGE: quot(
                      `Sorry, we could not create ${modelNameVariants.lowercaseWords}.`,
                    ),
                    TPL_MODEL_NAME: modelNameVariants.title,
                    TPL_EDIT_FORM: TsCodeUtils.mergeFragmentsAsJsxElement(
                      editFormComponentExpression,
                      {
                        submitData: 'submitData',
                        defaultValues: 'undefined',
                        ...createPageRenderedLoaders.childProps,
                      },
                    ),
                  },
                }),
              );
            }

            await builder.apply(
              renderers.route.render({
                id: `route-${modelId}`,
                destination: routePath,
                variables: {
                  TPL_ROUTE_PATH: quot(routeFilePath),
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
