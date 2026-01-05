import {
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsTemplate,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot, uppercaseFirstChar } from '@baseplate-dev/utils';
import { z } from 'zod';

import type {
  GraphQLFragment,
  GraphQLOperation,
} from '#src/writers/graphql/graphql.js';

import { graphqlImportsProvider } from '#src/generators/apollo/index.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import {
  renderTadaFragment,
  renderTadaOperation,
} from '#src/writers/graphql/gql-tada.js';

import type { DataLoader } from '../_utils/data-loader.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import { getModelNameVariants } from '../_utils/get-model-name-variants.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  order: z.number(),
  localRelationName: z.string().min(1),
  isOptional: z.boolean().optional(),
  localField: z.string().min(1),
  foreignModelName: z.string().min(1),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1),
  valueType: z.enum(['string', 'uuid']),
  defaultLabel: z.string().optional(),
  nullLabel: z.string().optional(),
});

export const adminCrudForeignInputGenerator = createGenerator({
  name: 'admin/admin-crud-foreign-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.localRelationName,
  buildTasks: ({
    label,
    localRelationName,
    isOptional,
    localField,
    foreignModelName,
    labelExpression,
    valueExpression,
    defaultLabel,
    nullLabel,
    order,
    valueType,
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        graphqlImports: graphqlImportsProvider,
      },
      run({ adminCrudInputContainer, reactComponentsImports, graphqlImports }) {
        const optionsName = `${localRelationName}Options`;
        const parentComponentName =
          adminCrudInputContainer.getParentComponentName();
        const parentComponentPath =
          adminCrudInputContainer.getParentComponentPath();

        const foreignModelNameVariants = getModelNameVariants(foreignModelName);

        const optionFragmentVariable = `${parentComponentName}${uppercaseFirstChar(optionsName)}Fragment`;
        const optionFragment: GraphQLFragment = {
          fragmentName: `${parentComponentName}_${optionsName}`,
          variableName: optionFragmentVariable,
          onType: foreignModelName,
          fields: [{ name: labelExpression }, { name: valueExpression }],
          path: parentComponentPath,
        };

        const loadOptionsQueryVariable = `${lowerCaseFirst(parentComponentName)}${uppercaseFirstChar(optionsName)}Query`;
        const loadOptionsQuery: GraphQLOperation = {
          type: 'query',
          variableName: loadOptionsQueryVariable,
          operationName: `${parentComponentName}${uppercaseFirstChar(optionsName)}`,
          fields: [
            {
              name: foreignModelNameVariants.graphqlList,
              fields: [{ type: 'spread', fragment: optionFragment }],
            },
          ],
        };

        const dataLoader: DataLoader = {
          routeLoaderFields: [
            {
              key: optionsName,
              value: tsTemplate`preloadQuery(${TsCodeUtils.importFragment(
                loadOptionsQueryVariable,
                parentComponentPath,
              )})`,
              contextFields: ['preloadQuery'],
            },
          ],
          propName: optionsName,
          propType: tsTemplate`${graphqlImports.FragmentOf.typeFragment()}<${optionFragmentVariable}>`,
          propPageValue: tsTemplate`${optionsName}`,
        };

        const optionsCreator = tsCodeFragment(
          `${optionsName}.map((option) => ({
        label: option.${labelExpression}${
          defaultLabel ? ` ?? ${defaultLabel}` : ''
        },
        value: option.${valueExpression},
      }))`,
        );

        const validationExpression =
          valueType === 'uuid' ? 'z.uuid()' : 'z.string()';

        adminCrudInputContainer.addInput({
          order,
          content: tsTemplateWithImports(
            [reactComponentsImports.ComboboxFieldController.declaration()],
            {
              hoistedFragments: [
                tsHoistedFragment(
                  `foreign-input-query-${optionsName}`,
                  renderTadaOperation(loadOptionsQuery, {
                    exported: true,
                    currentPath: parentComponentPath,
                  }),
                ),
                tsHoistedFragment(
                  `foreign-input-fragment-${optionsName}`,
                  renderTadaFragment(optionFragment, {
                    exported: true,
                    currentPath: parentComponentPath,
                  }),
                ),
              ],
            },
          )`<ComboboxFieldController
          label="${label}"
          control={control}
          name="${localField}"
          options={${
            nullLabel
              ? tsTemplate`[
              { label: ${quot(nullLabel)}, value: null },
              ...${optionsCreator}
            ]`
              : optionsCreator
          }}
        />`,
          graphQLFields: [{ name: localField }],
          validation: [
            {
              key: localField,
              expression: tsCodeFragment(
                `${validationExpression}${isOptional ? '.nullish()' : ''}`,
              ),
            },
          ],
          dataLoaders: [dataLoader],
        });
        return {};
      },
    }),
  }),
});
