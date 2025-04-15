import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { reactApolloProvider } from '@src/generators/apollo/react-apollo/index.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import { createForeignDataDependency } from '../_utils/foreign-data-dependency.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
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
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        reactComponents: reactComponentsProvider,
        reactApollo: reactApolloProvider,
      },
      run({ adminCrudInputContainer, reactComponents, reactApollo }) {
        const optionsName = `${localRelationName}Options`;
        const modelName = adminCrudInputContainer.getModelName();

        const { dataDependency, propName } = createForeignDataDependency({
          foreignModelName,
          modelName,
          reactApollo,
          labelExpression,
          valueExpression,
        });

        const optionsCreator = TypescriptCodeUtils.createExpression(
          `${propName}.map((option) => ({
        label: option.${labelExpression}${
          defaultLabel ? ` ?? ${defaultLabel}` : ''
        },
        value: option.${valueExpression},
      }))`,
        );

        adminCrudInputContainer.addInput({
          content: TypescriptCodeUtils.createExpression(
            `<ReactSelectInput.LabelledController
          label="${label}"
          control={control}
          name="${localField}"
          options={${optionsName}}
          ${adminCrudInputContainer.isInModal() ? 'fixedPosition' : ''}
        />`,
            'import { ReactSelectInput } from "%react-components"',
            { importMappers: [reactComponents] },
          ),
          graphQLFields: [{ name: localField }],
          validation: [
            {
              key: localField,
              expression: TypescriptCodeUtils.createExpression(
                `z.string().uuid()${isOptional ? '.nullish()' : ''}`,
              ),
            },
          ],
          dataDependencies: [dataDependency],
          header: TypescriptCodeUtils.formatBlock(
            `
        const ${optionsName} = OPTIONS;`,
            {
              OPTIONS: nullLabel
                ? optionsCreator.wrap(
                    (contents) =>
                      `[
              { label: ${quot(nullLabel)}, value: null },
              ...${contents}
            ]`,
                  )
                : optionsCreator,
            },
          ),
        });
        return {};
      },
    }),
  }),
});
