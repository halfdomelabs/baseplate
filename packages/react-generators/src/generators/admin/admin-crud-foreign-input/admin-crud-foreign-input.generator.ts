import {
  tsCodeFragment,
  TsCodeUtils,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { reactApolloProvider } from '#src/generators/apollo/react-apollo/index.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import { createForeignDataDependency } from '../_utils/foreign-data-dependency.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  order: z.number(),
  localRelationName: z.string().min(1),
  isOptional: z.boolean().optional(),
  localField: z.string().min(1),
  foreignModelName: z.string().min(1),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1).default('id'),
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
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        reactApollo: reactApolloProvider,
      },
      run({ adminCrudInputContainer, reactComponentsImports, reactApollo }) {
        const optionsName = `${localRelationName}Options`;
        const modelName = adminCrudInputContainer.getModelName();

        const { dataDependency, propName } = createForeignDataDependency({
          foreignModelName,
          modelName,
          reactApollo,
          labelExpression,
          valueExpression,
        });

        const optionsCreator = tsCodeFragment(
          `${propName}.map((option) => ({
        label: option.${labelExpression}${
          defaultLabel ? ` ?? ${defaultLabel}` : ''
        },
        value: option.${valueExpression},
      }))`,
        );

        adminCrudInputContainer.addInput({
          order,
          content: tsCodeFragment(
            `<ReactSelectInput.LabelledController
          label="${label}"
          control={control}
          name="${localField}"
          options={${optionsName}}
          ${adminCrudInputContainer.isInModal() ? 'fixedPosition' : ''}
        />`,
            reactComponentsImports.ReactSelectInput.declaration(),
          ),
          graphQLFields: [{ name: localField }],
          validation: [
            {
              key: localField,
              expression: tsCodeFragment(
                `z.string().uuid()${isOptional ? '.nullish()' : ''}`,
              ),
            },
          ],
          dataDependencies: [dataDependency],
          header: TsCodeUtils.formatFragment(
            `
        const ${optionsName} = OPTIONS;`,
            {
              OPTIONS: nullLabel
                ? tsTemplate`[
              { label: ${quot(nullLabel)}, value: null },
              ...${optionsCreator}
            ]`
                : optionsCreator,
            },
          ),
        });
        return {};
      },
    }),
  }),
});
