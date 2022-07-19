import { TypescriptCodeUtils } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { pluralize } from 'inflection';
import { z } from 'zod';
import { reactApolloProvider } from '@src/generators/apollo/react-apollo';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { lowerCaseFirst } from '@src/utils/case';
import { mergeGraphQLFields } from '@src/writers/graphql';
import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container';
import { AdminCrudDataDependency } from '../_utils/data-loaders';
import { convertExpressionToField } from '../_utils/graphql';

const descriptorSchema = z.object({
  label: z.string().min(1),
  localRelationName: z.string().min(1),
  isOptional: z.boolean().optional(),
  localField: z.string().min(1),
  foreignModelName: z.string().min(1),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1).default('id'),
  defaultLabel: z.string().optional(),
});

const AdminCrudForeignInputGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    adminCrudInputContainer: adminCrudInputContainerProvider,
    reactComponents: reactComponentsProvider,
    reactApollo: reactApolloProvider,
  },
  createGenerator(
    {
      label,
      localRelationName,
      isOptional,
      localField,
      foreignModelName,
      labelExpression,
      valueExpression,
      defaultLabel,
    },
    { adminCrudInputContainer, reactComponents, reactApollo }
  ) {
    const optionsName = `${localRelationName}Options`;
    const modelName = adminCrudInputContainer.getModelName();
    const fragmentName = `${modelName}${foreignModelName}Option`;
    const dataName = `${fragmentName}s`;

    const querySubcomponent = lowerCaseFirst(pluralize(foreignModelName));

    const loaderValueName = `${lowerCaseFirst(dataName)}Data`;
    const loaderErrorName = `${lowerCaseFirst(dataName)}Error`;

    const dataDependency: AdminCrudDataDependency = {
      propName: lowerCaseFirst(dataName),
      propType: TypescriptCodeUtils.createExpression(
        `${fragmentName}Fragment[]`,
        `import { ${fragmentName}Fragment } from '${reactApollo.getGeneratedFilePath()}'`
      ),
      graphFragments: [
        {
          name: fragmentName,
          type: foreignModelName,
          fields: mergeGraphQLFields([
            convertExpressionToField(labelExpression),
            convertExpressionToField(valueExpression),
          ]),
        },
      ],
      graphRoots: [
        {
          type: 'query',
          name: `Get${dataName}`,
          fields: [
            {
              type: 'simple',
              name: querySubcomponent,
              fields: [
                {
                  type: 'spread',
                  on: fragmentName,
                },
              ],
            },
          ],
        },
      ],
      loader: {
        loader: TypescriptCodeUtils.createBlock(
          `const { data: ${loaderValueName}, error: ${loaderErrorName} } = useGet${dataName}Query();`,
          `import { useGet${dataName}Query } from '${reactApollo.getGeneratedFilePath()}'`
        ),
        loaderErrorName,
        loaderValueName,
      },
      propLoaderValueGetter: (value) => `${value}.${querySubcomponent}`,
    };

    adminCrudInputContainer.addInput({
      content: TypescriptCodeUtils.createExpression(
        `<ReactSelectInput.LabelledController
          label="${label}"
          control={control}
          name="${localField}"
          options={${optionsName}}
        />`,
        'import { ReactSelectInput } from "%react-components"',
        { importMappers: [reactComponents] }
      ),
      graphQLFields: [{ name: localField }],
      validation: [
        {
          key: localField,
          expression: TypescriptCodeUtils.createExpression(
            `z.string().uuid()${isOptional ? '.nullish()' : ''}`
          ),
        },
      ],
      dataDependencies: [dataDependency],
      header: TypescriptCodeUtils.createBlock(`
        const ${optionsName} = ${lowerCaseFirst(dataName)}.map((option) => ({
          label: option.${labelExpression}${
        defaultLabel ? ` || ${defaultLabel}` : ''
      },
          value: option.${valueExpression},
        }));`),
    });
    return {
      build: async () => {},
    };
  },
});

export default AdminCrudForeignInputGenerator;
