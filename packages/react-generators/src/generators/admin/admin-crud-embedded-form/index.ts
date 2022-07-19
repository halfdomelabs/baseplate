import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
  InferTaskBuilderMap,
} from '@baseplate/sync';
import { capitalize } from 'inflection';
import _ from 'lodash';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactErrorProvider } from '@src/generators/core/react-error';
import { notEmpty } from '@src/utils/array';
import {
  AdminCrudInput,
  adminCrudInputContainerProvider,
} from '../_providers/admin-crud-input-container';
import { getLoaderExtraProps } from '../_utils/data-loaders';
import { adminCrudEditProvider } from '../admin-crud-edit';

const descriptorSchema = z.object({
  isList: z.boolean(),
  modelName: z.string(),
});

type Descriptor = z.infer<typeof descriptorSchema>;

interface AdminCrudEmbeddedComponent {
  expression: TypescriptCodeExpression;
  extraProps: string;
}

interface AdminCrudEmbeddedObjectFormInfo {
  type: 'object';
  embeddedFormComponent: AdminCrudEmbeddedComponent;
}

interface AdminCrudEmbeddedListFormInfo
  extends Omit<AdminCrudEmbeddedObjectFormInfo, 'type'> {
  type: 'list';
  embeddedTableComponent: AdminCrudEmbeddedComponent;
}

type AdminCrudEmbeddedFormInfo =
  | AdminCrudEmbeddedListFormInfo
  | AdminCrudEmbeddedObjectFormInfo;

export interface AdminCrudEmbeddedFormProvider {
  getEmbeddedFormInfo(): AdminCrudEmbeddedFormInfo;
}

export const adminCrudEmbeddedFormProvider =
  createProviderType<AdminCrudEmbeddedFormProvider>(
    'admin-crud-embedded-form',
    { isReadOnly: true }
  );

const createSetupFormTask = createTaskConfigBuilder(
  ({ modelName }: Descriptor) => ({
    name: 'setupForm',
    dependencies: {},
    exports: {
      adminCrudInputContainer: adminCrudInputContainerProvider,
    },
    run() {
      const inputFields: AdminCrudInput[] = [];

      return {
        getProviders: () => ({
          adminCrudInputContainer: {
            addInput: (input) => inputFields.push(input),
            getModelName: () => modelName,
          },
        }),
        build: () => ({ inputFields }),
      };
    },
  })
);

const createMainTask = createTaskConfigBuilder(
  (
    { isList, modelName }: Descriptor,
    taskDependencies?: InferTaskBuilderMap<{
      setupTask: typeof createSetupFormTask;
    }>
  ) => ({
    name: 'main',
    dependencies: {
      adminCrudEdit: adminCrudEditProvider,
      reactComponents: reactComponentsProvider,
      reactError: reactErrorProvider,
      typescript: typescriptProvider,
    },
    exports: {
      adminCrudEmbeddedForm: adminCrudEmbeddedFormProvider,
    },
    taskDependencies,
    run(
      { adminCrudEdit, reactComponents, reactError, typescript },
      { setupTask: { inputFields } }
    ) {
      const capitalizedModelName = capitalize(modelName);
      const formName = `Embedded${capitalizedModelName}Form`;
      const formDataType = `Embedded${capitalizedModelName}FormData`;
      const formSchema = `embedded${capitalizedModelName}FormSchema`;

      const tableName = `Embedded${capitalizedModelName}Form`;

      const [formImport, formPath] = makeImportAndFilePath(
        `${adminCrudEdit.getDirectoryBase()}/${formName}.tsx`
      );

      const inputDataDependencies = inputFields.flatMap(
        (f) => f.dataDependencies || []
      );

      return {
        getProviders: () => ({
          adminCrudEmbeddedForm: {
            getEmbeddedFormInfo: () => {
              const sharedData = {
                embeddedFormComponent: {
                  expression: TypescriptCodeUtils.createExpression(formName),
                  extraProps: getLoaderExtraProps(inputDataDependencies),
                },
              };
              if (isList) {
                return {
                  type: 'list',
                  ...sharedData,
                  embeddedTableComponent: {
                    expression: TypescriptCodeUtils.createExpression(formName),
                    extraProps: '',
                  },
                };
              }
              return {
                type: 'object',
                ...sharedData,
              };
            },
          },
        }),
        build: async (builder) => {
          const formFile = typescript.createTemplate(
            {
              EMBEDDED_FORM_DATA_TYPE: TypescriptCodeUtils.createExpression(
                formDataType,
                `import { ${formDataType} } from "${adminCrudEdit.getSchemaPath()}`
              ),
              EMBEDDED_FORM_DATA_SCHEMA: TypescriptCodeUtils.createExpression(
                formSchema,
                `import { ${formSchema} } from "${adminCrudEdit.getSchemaPath()}`
              ),
              COMPONENT_NAME: new TypescriptStringReplacement(formName),
              INPUTS: TypescriptCodeUtils.mergeExpressions(
                inputFields.map((input) => input.content),
                '\n'
              ),
              HEADER: TypescriptCodeUtils.mergeBlocks(
                inputFields.map((field) => field.header).filter(notEmpty)
              ),
              EXTRA_PROPS: TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
                _.fromPairs(
                  inputDataDependencies.map(
                    (d): [string, TypescriptCodeExpression] => [
                      d.propName,
                      d.propType,
                    ]
                  )
                )
              ),
              'EXTRA_PROP_SPREAD,': new TypescriptStringReplacement(
                inputDataDependencies.map((d) => d.propName).join(',\n')
              ),
            },
            { importMappers: [reactComponents, reactError] }
          );

          await builder.apply(
            formFile.renderToAction('EmbeddedForm.tsx', formPath)
          );
        },
      };
    },
  })
);

const AdminCrudEmbeddedFormGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    const setupTask = taskBuilder.addTask(createSetupFormTask(descriptor));
    taskBuilder.addTask(createMainTask(descriptor, { setupTask }));
  },
});

export default AdminCrudEmbeddedFormGenerator;
