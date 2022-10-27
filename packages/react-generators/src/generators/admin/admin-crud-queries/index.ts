import * as path from 'path';
import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
  writeFormattedAction,
} from '@baseplate/sync';
import { pluralize } from 'inflection';
import { z } from 'zod';
import { reactApolloProvider } from '@src/generators/apollo/react-apollo';
import { reactRoutesProvider } from '@src/providers/routes';
import { lowerCaseFirst } from '@src/utils/case';
import {
  areFieldsIdentical,
  GraphQLField,
  GraphQLFragment,
  GraphQLRoot,
  mergeGraphQLFragments,
  renderGraphQLFragment,
  renderGraphQLRoot,
} from '@src/writers/graphql';

const descriptorSchema = z.object({
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
  hookExpression: TypescriptCodeExpression;
  fieldName: string;
}

export interface AdminCrudQueriesProvider {
  setRowFields: (fields: GraphQLField[]) => void;
  setFormFields: (fields: GraphQLField[]) => void;
  getRowFragmentExpression: () => TypescriptCodeExpression;
  getEditFragmentExpression: () => TypescriptCodeExpression;
  getListQueryHookInfo: () => ApolloHookInfo;
  getEditQueryHookInfo: () => ApolloHookInfo;
  getCreateHookInfo: () => ApolloHookInfo;
  getUpdateHookInfo: () => ApolloHookInfo;
  getDeleteHookInfo: () => ApolloHookInfo;
  getListDocumentExpression: () => TypescriptCodeExpression;
  addRoot: (root: GraphQLRoot) => void;
  addFragment: (fragment: GraphQLFragment) => void;
}

export const adminCrudQueriesProvider =
  createProviderType<AdminCrudQueriesProvider>('admin-crud-queries');

const AdminCrudQueriesGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactApollo: reactApolloProvider,
    reactRoutes: reactRoutesProvider,
  },
  exports: {
    adminCrudQueries: adminCrudQueriesProvider,
  },
  createGenerator({ modelName }, { reactApollo, reactRoutes }) {
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

    function getGeneratedImport(name: string): TypescriptCodeExpression {
      return TypescriptCodeUtils.createExpression(
        name,
        `import { ${name} } from '${reactApollo.getGeneratedFilePath()}'`
      );
    }

    function getHookInfo(hookName: string, fieldName: string): ApolloHookInfo {
      return {
        fieldName,
        hookExpression: getGeneratedImport(hookName),
      };
    }

    const queries: string[] = [];

    const fragments: GraphQLFragment[] = [];

    const roots: GraphQLRoot[] = [];

    return {
      getProviders: () => ({
        adminCrudQueries: {
          setRowFields: (fields) => {
            config.rowFields = fields;
          },
          setFormFields: (fields) => {
            config.formFields = fields;
          },
          getRowFragmentExpression: () =>
            getGeneratedImport(`${rowFragmentName}Fragment`),
          getEditFragmentExpression: () =>
            getGeneratedImport(`${editFragmentName}Fragment`),
          getListQueryHookInfo: () =>
            getHookInfo(`use${listQueryName}Query`, listFieldName),
          getEditQueryHookInfo: () =>
            getHookInfo(`use${editQueryName}Query`, editFieldName),
          getCreateHookInfo: () => {
            config.generateCreate = true;
            return getHookInfo(
              `useCreate${modelName}Mutation`,
              createFieldName
            );
          },
          getUpdateHookInfo: () => {
            config.generateUpdate = true;
            return getHookInfo(
              `useUpdate${modelName}Mutation`,
              updateFieldName
            );
          },
          getDeleteHookInfo: () => {
            config.generateDelete = true;
            return getHookInfo(
              `useDelete${modelName}Mutation`,
              deleteFieldName
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
                    root.name || 'unnamed'
                  } already exists with different fields`
                );
              }
              return;
            }
            roots.push(root);
          },
        },
      }),
      build: async (builder) => {
        // merge fragments together
        mergeGraphQLFragments(fragments).forEach((fragment) => {
          queries.push(renderGraphQLFragment(fragment));
        });

        // merge roots together
        roots.forEach((root) => {
          queries.push(renderGraphQLRoot(root));
        });

        if (config.rowFields.length) {
          // create fragment and query
          queries.push(
            renderGraphQLFragment({
              name: rowFragmentName,
              type: modelName,
              fields: config.rowFields,
            })
          );

          queries.push(
            renderGraphQLRoot({
              type: 'query',
              name: listQueryName,
              fields: [
                {
                  name: listFieldName,
                  fields: [{ type: 'spread', on: rowFragmentName }],
                },
              ],
            })
          );
        }

        if (config.formFields.length) {
          queries.push(
            renderGraphQLFragment({
              name: editFragmentName,
              type: modelName,
              fields: config.formFields,
            })
          );

          queries.push(
            renderGraphQLRoot({
              type: 'query',
              name: editQueryName,
              variables: [{ name: 'id', type: 'Uuid!' }],
              fields: [
                {
                  name: editFieldName,
                  args: [
                    { name: 'id', value: { type: 'variable', variable: 'id' } },
                  ],
                  fields: [{ type: 'spread', on: editFragmentName }],
                },
              ],
            })
          );
        }

        function createMutation(
          mutationName: string,
          fieldName: string,
          inputType: string,
          returnIdOnly?: boolean
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

        if (config.generateCreate) {
          queries.push(
            createMutation(
              createMutationName,
              createFieldName,
              `Create${modelName}Input`
            )
          );
        }

        if (config.generateUpdate) {
          queries.push(
            createMutation(
              updateMutationName,
              updateFieldName,
              `Update${modelName}Input`
            )
          );
        }

        if (config.generateDelete) {
          queries.push(
            createMutation(
              deleteMutationName,
              deleteFieldName,
              `Delete${modelName}Input`,
              true
            )
          );
        }

        if (queries.length) {
          const filePath = path.join(
            reactRoutes.getDirectoryBase(),
            'queries.gql'
          );
          reactApollo.registerGqlFile(filePath);
          await builder.apply(
            writeFormattedAction({
              destination: filePath,
              contents: queries.join('\n\n'),
            })
          );
        }
      },
    };
  },
});

export default AdminCrudQueriesGenerator;
