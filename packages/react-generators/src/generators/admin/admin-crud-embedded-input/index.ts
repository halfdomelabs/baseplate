import { TypescriptCodeUtils } from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { z } from 'zod';
import { mergeGraphQLFields } from '@src/writers/graphql';
import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container';
import { adminComponentsProvider } from '../admin-components';
import { adminCrudEmbeddedFormProvider } from '../admin-crud-embedded-form';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelRelation: z.string().min(1),
  embeddedFormRef: z.string().min(1),
});

type Descriptor = z.infer<typeof descriptorSchema>;

export type AdminCrudEmbeddedInputProvider = unknown;

export const adminCrudEmbeddedInputProvider =
  createProviderType<AdminCrudEmbeddedInputProvider>(
    'admin-crud-embedded-input'
  );

const createMainTask = createTaskConfigBuilder(
  ({ label, modelRelation, embeddedFormRef }: Descriptor) => ({
    name: 'main',
    dependencies: {
      adminCrudInputContainer: adminCrudInputContainerProvider,
      adminComponents: adminComponentsProvider,
      adminCrudEmbeddedForm: adminCrudEmbeddedFormProvider
        .dependency()
        .reference(embeddedFormRef),
    },
    exports: {
      adminCrudEmbeddedInput: adminCrudEmbeddedInputProvider,
    },
    run({ adminCrudInputContainer, adminComponents, adminCrudEmbeddedForm }) {
      const formInfo = adminCrudEmbeddedForm.getEmbeddedFormInfo();
      const {
        embeddedFormComponent,
        dataDependencies,
        graphQLFields,
        validationExpression,
      } = formInfo;

      const content =
        formInfo.type === 'object'
          ? TypescriptCodeUtils.formatExpression(
              `<EmbeddedObjectInput.LabelledController
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
              {
                importText: [
                  `import { EmbeddedObjectInput } from "%admin-components"`,
                ],
                importMappers: [adminComponents],
              }
            )
          : TypescriptCodeUtils.formatExpression(
              `<EmbeddedListInput.LabelledController
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
              {
                importText: [
                  `import { EmbeddedListInput } from "%admin-components"`,
                ],
                importMappers: [adminComponents],
              }
            );

      adminCrudInputContainer.addInput({
        content,
        graphQLFields: [
          { name: modelRelation, fields: mergeGraphQLFields(graphQLFields) },
        ],
        validation: [{ key: modelRelation, expression: validationExpression }],
        dataDependencies,
      });

      return {
        getProviders: () => ({
          adminCrudEmbeddedInput: {},
        }),
        build: () => {},
      };
    },
  })
);

const AdminCrudEmbeddedInputGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default AdminCrudEmbeddedInputGenerator;
