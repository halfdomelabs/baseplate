import {
  makeImportAndFilePath,
  TypescriptCodeBlock,
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
import _ from 'lodash';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactErrorProvider } from '@src/generators/core/react-error';
import { notEmpty } from '@src/utils/array';
import { upperCaseFirst } from '@src/utils/case';
import { GraphQLField } from '@src/writers/graphql';
import {
  AdminCrudColumn,
  adminCrudColumnContainerProvider,
} from '../_providers/admin-crud-column-container';
import {
  AdminCrudInput,
  adminCrudInputContainerProvider,
} from '../_providers/admin-crud-input-container';
import {
  AdminCrudDataDependency,
  getPassthroughExtraProps,
} from '../_utils/data-loaders';
import {
  adminComponentsProvider,
  AdminComponentsProvider,
} from '../admin-components';
import { adminCrudEditProvider } from '../admin-crud-edit';

const descriptorSchema = z.object({
  name: z.string(),
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
  dataDependencies: AdminCrudDataDependency[];
  graphQLFields: GraphQLField[];
  validationExpression: TypescriptCodeExpression;
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

function getComponentProps({
  inputType,
  componentType,
  formDataType,
  dataDependencies,
  adminComponents,
}: {
  inputType: 'Object' | 'List';
  componentType: 'Form' | 'Table';
  formDataType: string;
  dataDependencies: AdminCrudDataDependency[];
  adminComponents: AdminComponentsProvider;
}): TypescriptCodeExpression {
  const defaultProps = `Embedded${inputType}${componentType}Props`;
  const defaultPropsExpression = new TypescriptCodeExpression(
    `Embedded${inputType}${componentType}Props`,
    `import { ${defaultProps} } from "%admin-components/Embedded${inputType}Input"`,
    { importMappers: [adminComponents] }
  ).append(`<${formDataType}>`);
  if (dataDependencies.length === 0) {
    return defaultPropsExpression;
  }

  const propsName = `${componentType}Props`;

  return new TypescriptCodeExpression(propsName, null, {
    headerBlocks: [
      TypescriptCodeUtils.formatBlock(
        `
        interface PROPS_NAME extends DEFAULT_PROPS {
          INTERFACE_CONTENT
        }`,
        {
          PROPS_NAME: propsName,
          DEFAULT_PROPS: defaultPropsExpression,
          INTERFACE_CONTENT: TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
            _.fromPairs(
              dataDependencies.map((d): [string, TypescriptCodeExpression] => [
                d.propName,
                d.propType,
              ])
            )
          ),
        }
      ),
    ],
  });
}

const createSetupFormTask = createTaskConfigBuilder(
  ({ modelName, isList }: Descriptor) => ({
    name: 'setupForm',
    dependencies: {},
    exports: {
      adminCrudInputContainer: adminCrudInputContainerProvider,
      adminCrudColumnContainer: adminCrudColumnContainerProvider,
    },
    run() {
      const inputFields: AdminCrudInput[] = [];
      const tableColumns: AdminCrudColumn[] = [];

      return {
        getProviders: () => ({
          adminCrudInputContainer: {
            addInput: (input) => inputFields.push(input),
            getModelName: () => modelName,
          },
          adminCrudColumnContainer: {
            addColumn: (column) => {
              if (!isList) {
                throw new Error(
                  'Cannot add columns to a non-list embedded form'
                );
              }
              tableColumns.push(column);
            },
            getModelName: () => modelName,
          },
        }),
        build: () => ({ inputFields, tableColumns }),
      };
    },
  })
);

const createMainTask = createTaskConfigBuilder(
  (
    { isList, name }: Descriptor,
    taskDependencies?: InferTaskBuilderMap<{
      setupTask: typeof createSetupFormTask;
    }>
  ) => ({
    name: 'main',
    dependencies: {
      adminCrudEdit: adminCrudEditProvider,
      adminComponents: adminComponentsProvider,
      reactComponents: reactComponentsProvider,
      reactError: reactErrorProvider,
      typescript: typescriptProvider,
    },
    exports: {
      adminCrudEmbeddedForm: adminCrudEmbeddedFormProvider,
    },
    taskDependencies,
    run(
      {
        adminCrudEdit,
        reactComponents,
        reactError,
        typescript,
        adminComponents,
      },
      { setupTask: { inputFields, tableColumns } }
    ) {
      const capitalizedName = upperCaseFirst(name);
      const formName = `Embedded${capitalizedName}Form`;
      const formDataType = `Embedded${capitalizedName}FormData`;
      const formSchema = `embedded${capitalizedName}FormSchema`;

      const [formImport, formPath] = makeImportAndFilePath(
        `${adminCrudEdit.getDirectoryBase()}/${formName}.tsx`
      );

      const inputDataDependencies = inputFields.flatMap(
        (f) => f.dataDependencies || []
      );

      const tableName = `Embedded${capitalizedName}Table`;
      const tableDataDependencies = tableColumns.flatMap(
        (f) => f.display.dataDependencies || []
      );

      const allDataDependencies = [
        ...inputDataDependencies,
        ...tableDataDependencies,
      ];

      const graphQLFields = [
        ...inputFields.flatMap((f) => f.graphQLFields),
        ...tableColumns.flatMap((f) => f.display.graphQLFields),
      ];

      // Create schema
      const validations = inputFields.flatMap((f) => f.validation);
      const embeddedBlock = TypescriptCodeUtils.formatBlock(
        `
export const SCHEMA_NAME = z.object(SCHEMA_OBJECT);

export type SCHEMA_TYPE = z.infer<typeof SCHEMA_NAME>;
`,
        {
          SCHEMA_NAME: formSchema,
          SCHEMA_TYPE: formDataType,
          SCHEMA_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
            _.zipObject(
              validations.map((v) => v.key),
              validations.map((v) => v.expression)
            )
          ),
        },
        { headerKey: formSchema }
      );

      const validationExpression = TypescriptCodeUtils.createExpression(
        `${isList ? `z.array(${formSchema})` : formSchema}.nullish()`,
        undefined,
        {
          headerBlocks: [embeddedBlock],
        }
      );

      return {
        getProviders: () => ({
          adminCrudEmbeddedForm: {
            getEmbeddedFormInfo: () => {
              const sharedData = {
                embeddedFormComponent: {
                  expression: TypescriptCodeUtils.createExpression(
                    formName,
                    `import { ${formName} } from '${formImport}'`
                  ),
                  extraProps: getPassthroughExtraProps(inputDataDependencies),
                },
                dataDependencies: allDataDependencies,
                graphQLFields,
                validationExpression,
              };
              if (isList) {
                return {
                  type: 'list',
                  ...sharedData,
                  embeddedTableComponent: {
                    expression: TypescriptCodeUtils.createExpression(
                      tableName,
                      `import { ${tableName} } from '${formImport}'`
                    ),
                    extraProps: getPassthroughExtraProps(tableDataDependencies),
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
          const headers = tableColumns.map((column) =>
            TypescriptCodeUtils.createExpression(
              `<Table.HeadCell>${column.label}</Table.HeadCell>`
            )
          );
          const cells = tableColumns.map((column) =>
            column.display
              .content('item')
              .wrap((content) => `<Table.Cell>${content}</Table.Cell>`)
          );
          const tableComponent = !isList
            ? new TypescriptCodeBlock('')
            : TypescriptCodeUtils.formatBlock(
                `
            export function COMPONENT_NAME({
              items,
              edit,
              remove,
              EXTRA_PROP_SPREAD
            }: PROPS): JSX.Element {
              return (
                <Table className="max-w-lg">
                  <Table.Head>
                    <Table.HeadRow>
                      HEADERS
                      <Table.HeadCell>Actions</Table.HeadCell>
                    </Table.HeadRow>
                  </Table.Head>
                  <Table.Body>
                    {items.map((item, idx) => (
                      <Table.Row key={item.id}>
                        CELLS
                        <Table.Cell className="space-x-4">
                          <LinkButton onClick={() => edit(idx)}>Edit</LinkButton>
                          <LinkButton negative onClick={() => remove(idx)}>
                            Remove
                          </LinkButton>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              );
            }
`,
                {
                  COMPONENT_NAME: tableName,
                  EXTRA_PROP_SPREAD: new TypescriptStringReplacement(
                    tableDataDependencies.map((d) => d.propName).join(',\n')
                  ),
                  PROPS: getComponentProps({
                    inputType: isList ? 'List' : 'Object',
                    componentType: 'Table',
                    formDataType,
                    dataDependencies: tableDataDependencies,
                    adminComponents,
                  }),
                  HEADERS: TypescriptCodeUtils.mergeExpressions(headers, '\n'),
                  CELLS: TypescriptCodeUtils.mergeExpressions(cells, '\n'),
                },
                {
                  importText: [
                    'import {Table, LinkButton} from "%react-components"',
                  ],
                  importMappers: [reactComponents],
                }
              );

          const formFile = typescript.createTemplate(
            {
              EMBEDDED_FORM_DATA_TYPE: TypescriptCodeUtils.createExpression(
                formDataType,
                `import { ${formDataType} } from "${adminCrudEdit.getSchemaImport()}`
              ),
              EMBEDDED_FORM_DATA_SCHEMA: TypescriptCodeUtils.createExpression(
                formSchema,
                `import { ${formSchema} } from "${adminCrudEdit.getSchemaImport()}`
              ),
              COMPONENT_NAME: new TypescriptStringReplacement(formName),
              INPUTS: TypescriptCodeUtils.mergeExpressions(
                inputFields.map((input) => input.content),
                '\n'
              ),
              HEADER: TypescriptCodeUtils.mergeBlocks(
                inputFields.map((field) => field.header).filter(notEmpty)
              ),
              'EXTRA_PROP_SPREAD,': new TypescriptStringReplacement(
                inputDataDependencies.map((d) => d.propName).join(',\n')
              ),
              PROPS: getComponentProps({
                inputType: isList ? 'List' : 'Object',
                componentType: 'Form',
                formDataType,
                dataDependencies: inputDataDependencies,
                adminComponents,
              }),
              TABLE_COMPONENT: tableComponent,
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
  getDefaultChildGenerators: () => ({
    columns: { isMultiple: true },
    inputs: { isMultiple: true },
  }),
  buildTasks(taskBuilder, descriptor) {
    const setupTask = taskBuilder.addTask(createSetupFormTask(descriptor));
    taskBuilder.addTask(createMainTask(descriptor, { setupTask }));
  },
});

export default AdminCrudEmbeddedFormGenerator;
