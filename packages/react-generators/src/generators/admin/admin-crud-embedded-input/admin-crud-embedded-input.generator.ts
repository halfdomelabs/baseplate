import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { mergeGraphqlFields } from '#src/writers/graphql/index.js';

import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import { adminComponentsImportsProvider } from '../admin-components/index.js';
import { adminCrudEmbeddedFormProvider } from '../admin-crud-embedded-form/index.js';

const descriptorSchema = z.object({
  id: z.string().min(1),
  order: z.number(),
  label: z.string().min(1),
  modelRelation: z.string().min(1),
  embeddedFormRef: z.string().min(1),
  isRequired: z.boolean().optional(),
});

export type AdminCrudEmbeddedInputProvider = unknown;

export const adminCrudEmbeddedInputProvider =
  createProviderType<AdminCrudEmbeddedInputProvider>(
    'admin-crud-embedded-input',
  );

export const adminCrudEmbeddedInputGenerator = createGenerator({
  name: 'admin/admin-crud-embedded-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.id,
  buildTasks: ({
    label,
    modelRelation,
    embeddedFormRef,
    isRequired,
    order,
  }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        adminComponentsImports: adminComponentsImportsProvider,
        adminCrudEmbeddedForm: adminCrudEmbeddedFormProvider
          .dependency()
          .reference(embeddedFormRef),
      },
      exports: {
        adminCrudEmbeddedInput: adminCrudEmbeddedInputProvider.export(),
      },
      run({
        adminCrudInputContainer,
        adminComponentsImports,
        adminCrudEmbeddedForm,
      }) {
        const formInfo = adminCrudEmbeddedForm.getEmbeddedFormInfo();
        const {
          embeddedFormComponent,
          dataLoaders,
          graphQLFields,
          validationExpression,
        } = formInfo;

        const content =
          formInfo.type === 'object'
            ? TsCodeUtils.formatFragment(
                `<EmbeddedObjectFieldController
          label="${label}"
          control={control}
          name="${modelRelation}"
          renderForm={(formProps) => (
            <EMBEDDED_FORM_COMPONENT {...formProps} EXTRA_FORM_PROPS />
          )}
        />`,
                {
                  EMBEDDED_FORM_COMPONENT: embeddedFormComponent.expression,
                  EXTRA_FORM_PROPS: embeddedFormComponent.extraProps,
                },
                adminComponentsImports.EmbeddedObjectFieldController.declaration(),
              )
            : TsCodeUtils.formatFragment(
                `<EmbeddedListFieldController
        label="${label}"
        control={control}
        name="${modelRelation}"
        renderForm={(formProps) => (
          <EMBEDDED_FORM_COMPONENT {...formProps} EXTRA_FORM_PROPS />
        )}
        renderTable={(tableProps) => (
          <EMBEDDED_TABLE_COMPONENT {...tableProps} EXTRA_TABLE_PROPS />
        )}
      />`,
                {
                  EMBEDDED_FORM_COMPONENT: embeddedFormComponent.expression,
                  EXTRA_FORM_PROPS: embeddedFormComponent.extraProps,
                  EMBEDDED_TABLE_COMPONENT:
                    formInfo.embeddedTableComponent.expression,
                  EXTRA_TABLE_PROPS: formInfo.embeddedTableComponent.extraProps,
                },
                adminComponentsImports.EmbeddedListFieldController.declaration(),
              );

        adminCrudInputContainer.addInput({
          order,
          content,
          graphQLFields: [
            { name: modelRelation, fields: mergeGraphqlFields(graphQLFields) },
          ],
          validation: [
            {
              key: modelRelation,
              expression: tsTemplate`${validationExpression}${
                isRequired ? '' : '.nullish()'
              }`,
            },
          ],
          dataLoaders,
        });

        return {
          providers: {
            adminCrudEmbeddedInput: {},
          },
        };
      },
    }),
  }),
});
