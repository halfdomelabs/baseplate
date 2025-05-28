import {
  tsCodeFragment,
  tsImportBuilder,
  tsTypeImportBuilder,
} from '@halfdomelabs/core-generators';
import { pluralize } from 'inflection';

import type { ReactApolloProvider } from '#src/generators/apollo/react-apollo/react-apollo.generator.js';

import { lowerCaseFirst } from '#src/utils/case.js';
import { mergeGraphQLFields } from '#src/writers/graphql/index.js';

import type { AdminCrudDataDependency } from './data-loaders.js';

import { convertExpressionToField } from './graphql.js';

interface ForeignDataDependencyOptions {
  foreignModelName: string;
  modelName: string;
  reactApollo: ReactApolloProvider;
  labelExpression: string;
  valueExpression: string;
}

export function createForeignDataDependency({
  foreignModelName,
  modelName,
  reactApollo,
  labelExpression,
  valueExpression,
}: ForeignDataDependencyOptions): {
  dataDependency: AdminCrudDataDependency;
  propName: string;
} {
  const fragmentName = `${modelName}${foreignModelName}Option`;
  const dataName = `${fragmentName}s`;
  const propName = lowerCaseFirst(dataName);

  const querySubcomponent = lowerCaseFirst(pluralize(foreignModelName));

  const loaderValueName = `${lowerCaseFirst(dataName)}Data`;
  const loaderErrorName = `${lowerCaseFirst(dataName)}Error`;

  const dataDependency: AdminCrudDataDependency = {
    propName,
    propType: tsCodeFragment(
      `${fragmentName}Fragment[]`,
      tsTypeImportBuilder([`${fragmentName}Fragment`]).from(
        reactApollo.getGeneratedFilePath(),
      ),
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
      loader: tsCodeFragment(
        `const { data: ${loaderValueName}, error: ${loaderErrorName} } = useGet${dataName}Query();`,
        tsImportBuilder([`useGet${dataName}Query`]).from(
          reactApollo.getGeneratedFilePath(),
        ),
      ),
      loaderErrorName,
      loaderValueName,
    },
    propLoaderValueGetter: (value) => `${value}.${querySubcomponent}`,
  };

  return { dataDependency, propName };
}
