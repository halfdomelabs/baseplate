import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { pluralize } from 'inflection';
import path from 'node:path';
import { z } from 'zod';

import type {
  GraphQLField,
  GraphQLFragment,
  GraphQLRoot,
} from '#src/writers/graphql/index.js';

import { reactApolloProvider } from '#src/generators/apollo/react-apollo/react-apollo.generator.js';
import { reactRoutesProvider } from '#src/providers/routes.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import {
  areFieldsIdentical,
  mergeGraphQLFragments,
  renderGraphQLFragment,
  renderGraphQLRoot,
} from '#src/writers/graphql/index.js';

import { adminCrudSectionScope } from '../admin-crud-section/admin-crud-section.generator.js';

const descriptorSchema = z.object({
  modelId: z.string(),
  modelName: z.string(),
});

interface AdminCrudQueriesConfig {
  rowFields: GraphQLField[];
  formFields: GraphQLField[];
  generateCreate?: boolean;
  generateUpdate?: boolean;
  generateDelete?: boolean;
}

interface ApolloHookInfo {
  hookExpression: TsCodeFragment;
  fieldName: string;
}

export interface AdminCrudQueriesProvider {
  setRowFields: (fields: GraphQLField[]) => void;
  setFormFields: (fields: GraphQLField[]) => void;
  getRowFragmentExpression: () => TsCodeFragment;
  getEditFragmentExpression: () => TsCodeFragment;
  getListQueryHookInfo: () => ApolloHookInfo;
  getEditQueryHookInfo: () => ApolloHookInfo;
  getCreateHookInfo: () => ApolloHookInfo;
  getUpdateHookInfo: () => ApolloHookInfo;
  getDeleteHookInfo: () => ApolloHookInfo;
  getListDocumentExpression: () => TsCodeFragment;
  addRoot: (root: GraphQLRoot) => void;
  addFragment: (fragment: GraphQLFragment) => void;
}

export const adminCrudQueriesProvider =
  createProviderType<AdminCrudQueriesProvider>('admin-crud-queries');

export const adminCrudQueriesGenerator = createGenerator({
  name: 'admin/admin-crud-queries',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelName,
  buildTasks: ({ modelName, modelId }) => ({
    main: createGeneratorTask({
      dependencies: {
        reactApollo: reactApolloProvider,
        reactRoutes: reactRoutesProvider,
      },
      exports: {
        adminCrudQueries: adminCrudQueriesProvider.export(
          adminCrudSectionScope,
        ),
      },
      run({ reactApollo, reactRoutes }) {
        const config: AdminCrudQueriesConfig = {
          rowFields: [],
          formFields: [],
        };
        const rowFragmentName = `${modelName}Row`;
        const editFragmentName = `${modelName}Edit`;

        const listQueryName = `Get${pluralize(modelName)}`;
        const listFieldName = lowerCaseFirst(pluralize(modelName));

        const editQueryName = `${editFragmentName}ById`;
        const editFieldName = lowerCaseFirst(modelName);

        const createFieldName = `create${modelName}`;
        const createMutationName = `Create${modelName}`;

        const updateFieldName = `update${modelName}`;
        const updateMutationName = `Update${modelName}`;

        const deleteFieldName = `delete${modelName}`;
        const deleteMutationName = `Delete${modelName}`;

        function getGeneratedImport(name: string): TsCodeFragment {
          return TsCodeUtils.importFragment(
            name,
            reactApollo.getGeneratedFilePath(),
          );
        }

        function getGeneratedTypeImport(name: string): TsCodeFragment {
          return TsCodeUtils.typeImportFragment(
            name,
            reactApollo.getGeneratedFilePath(),
          );
        }

        function getHookInfo(
          hookName: string,
          fieldName: string,
        ): ApolloHookInfo {
          return {
            fieldName,
            hookExpression: getGeneratedImport(hookName),
          };
        }

        const queries: string[] = [];

        const fragments: GraphQLFragment[] = [];

        const roots: GraphQLRoot[] = [];

        function createMutation(
          mutationName: string,
          fieldName: string,
          inputType: string,
          returnIdOnly?: boolean,
        ): string {
          return renderGraphQLRoot({
            type: 'mutation',
            name: mutationName,
            variables: [{ name: 'input', type: `${inputType}!` }],
            fields: [
              {
                name: fieldName,
                args: [
                  {
                    name: 'input',
                    value: { type: 'variable', variable: 'input' },
                  },
                ],
                fields: [
                  {
                    name: editFieldName,
                    fields: [
                      returnIdOnly
                        ? { name: 'id' }
                        : { type: 'spread', on: editFragmentName },
                    ],
                  },
                ],
              },
            ],
          });
        }

        return {
          providers: {
            adminCrudQueries: {
              setRowFields: (fields) => {
                config.rowFields = fields;
              },
              setFormFields: (fields) => {
                config.formFields = fields;
              },
              getRowFragmentExpression: () =>
                getGeneratedTypeImport(`${rowFragmentName}Fragment`),
              getEditFragmentExpression: () =>
                getGeneratedTypeImport(`${editFragmentName}Fragment`),
              getListQueryHookInfo: () =>
                getHookInfo(`use${listQueryName}Query`, listFieldName),
              getEditQueryHookInfo: () =>
                getHookInfo(`use${editQueryName}Query`, editFieldName),
              getCreateHookInfo: () => {
                config.generateCreate = true;
                return getHookInfo(
                  `useCreate${modelName}Mutation`,
                  createFieldName,
                );
              },
              getUpdateHookInfo: () => {
                config.generateUpdate = true;
                return getHookInfo(
                  `useUpdate${modelName}Mutation`,
                  updateFieldName,
                );
              },
              getDeleteHookInfo: () => {
                config.generateDelete = true;
                return getHookInfo(
                  `useDelete${modelName}Mutation`,
                  deleteFieldName,
                );
              },
              getListDocumentExpression: () =>
                getGeneratedImport(`${listQueryName}Document`),
              addFragment: (fragment) => {
                fragments.push(fragment);
              },
              addRoot: (root) => {
                const existingRoot = roots.find((r) => r.name === root.name);
                if (existingRoot) {
                  if (!areFieldsIdentical(existingRoot.fields, root.fields)) {
                    throw new Error(
                      `Root ${
                        root.name ?? 'unnamed'
                      } already exists with different fields`,
                    );
                  }
                  return;
                }
                roots.push(root);
              },
            },
          },
          build: (builder) => {
            // merge fragments together
            for (const fragment of mergeGraphQLFragments(fragments)) {
              queries.push(renderGraphQLFragment(fragment));
            }

            // merge roots together
            for (const root of roots) {
              queries.push(renderGraphQLRoot(root));
            }

            if (config.rowFields.length > 0) {
              // create fragment and query
              queries.push(
                renderGraphQLFragment({
                  name: rowFragmentName,
                  type: modelName,
                  fields: config.rowFields,
                }),
                renderGraphQLRoot({
                  type: 'query',
                  name: listQueryName,
                  fields: [
                    {
                      name: listFieldName,
                      fields: [{ type: 'spread', on: rowFragmentName }],
                    },
                  ],
                }),
              );
            }

            if (config.formFields.length > 0) {
              queries.push(
                renderGraphQLFragment({
                  name: editFragmentName,
                  type: modelName,
                  fields: config.formFields,
                }),
                renderGraphQLRoot({
                  type: 'query',
                  name: editQueryName,
                  variables: [{ name: 'id', type: 'Uuid!' }],
                  fields: [
                    {
                      name: editFieldName,
                      args: [
                        {
                          name: 'id',
                          value: { type: 'variable', variable: 'id' },
                        },
                      ],
                      fields: [{ type: 'spread', on: editFragmentName }],
                    },
                  ],
                }),
              );
            }

            if (config.generateCreate) {
              queries.push(
                createMutation(
                  createMutationName,
                  createFieldName,
                  `Create${modelName}Input`,
                ),
              );
            }

            if (config.generateUpdate) {
              queries.push(
                createMutation(
                  updateMutationName,
                  updateFieldName,
                  `Update${modelName}Input`,
                ),
              );
            }

            if (config.generateDelete) {
              queries.push(
                createMutation(
                  deleteMutationName,
                  deleteFieldName,
                  `Delete${modelName}Input`,
                  true,
                ),
              );
            }

            if (queries.length > 0) {
              const filePath = path.join(
                reactRoutes.getDirectoryBase(),
                'queries.gql',
              );
              reactApollo.registerGqlFile(filePath);
              builder.writeFile({
                id: `${modelId}-crud-queries`,
                destination: filePath,
                contents: queries.join('\n\n'),
              });
            }
          },
        };
      },
    }),
  }),
});
