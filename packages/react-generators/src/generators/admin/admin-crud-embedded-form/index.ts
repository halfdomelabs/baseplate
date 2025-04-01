import {
  makeImportAndFilePath,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createOutputProviderType,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import type { GraphQLField } from '@src/writers/graphql/index.js';

import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';
import { reactErrorProvider } from '@src/generators/core/react-error/index.js';
import { notEmpty } from '@src/utils/array.js';
import { upperCaseFirst } from '@src/utils/case.js';

import type { AdminCrudColumn } from '../_providers/admin-crud-column-container.js';
import type {
  AdminCrudInput,
  AdminCrudInputValidation,
} from '../_providers/admin-crud-input-container.js';
import type { AdminCrudDataDependency } from '../_utils/data-loaders.js';
import type { AdminComponentsProvider } from '../admin-components/index.js';

import { adminCrudColumnContainerProvider } from '../_providers/admin-crud-column-container.js';
import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import {
  getPassthroughExtraProps,
  mergeAdminCrudDataDependencies,
} from '../_utils/data-loaders.js';
import { adminComponentsProvider } from '../admin-components/index.js';
import { adminCrudEditProvider } from '../admin-crud-edit/index.js';
import { adminCrudSectionScope } from '../admin-crud-section/index.js';

const descriptorSchema = z.object({
  id: z.string(),
  name: z.string(),
  isList: z.boolean(),
  modelName: z.string(),
  idField: z.string().optional(),
});

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
    { isReadOnly: true },
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
    { importMappers: [adminComponents] },
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
            Object.fromEntries(
              dataDependencies.map((d): [string, TypescriptCodeExpression] => [
                d.propName,
                d.propType,
              ]),
            ),
          ),
        },
      ),
    ],
  });
}

const adminCrudEmbeddedFormSetupProvider = createOutputProviderType<{
  inputFields: AdminCrudInput[];
  tableColumns: AdminCrudColumn[];
}>('admin-crud-embedded-form-setup');

export const adminCrudEmbeddedFormGenerator = createGenerator({
  name: 'admin/admin-crud-embedded-form',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ id, name, modelName, isList, idField }) => [
    createGeneratorTask({
      name: 'setupForm',
      dependencies: {},
      exports: {
        adminCrudInputContainer: adminCrudInputContainerProvider.export(),
        adminCrudColumnContainer: adminCrudColumnContainerProvider.export(),
      },
      outputs: {
        adminCrudEmbeddedFormSetup: adminCrudEmbeddedFormSetupProvider.export(),
      },
      run() {
        const inputFields: AdminCrudInput[] = [];
        const tableColumns: AdminCrudColumn[] = [];

        return {
          providers: {
            adminCrudInputContainer: {
              addInput: (input) => inputFields.push(input),
              getModelName: () => modelName,
              isInModal: () => true,
            },
            adminCrudColumnContainer: {
              addColumn: (column) => {
                if (!isList) {
                  throw new Error(
                    'Cannot add columns to a non-list embedded form',
                  );
                }
                tableColumns.push(column);
              },
              getModelName: () => modelName,
            },
          },
          build: () => ({
            adminCrudEmbeddedFormSetup: { inputFields, tableColumns },
          }),
        };
      },
    }),
    createGeneratorTask({
      name: 'main',
      dependencies: {
        adminCrudEdit: adminCrudEditProvider,
        adminComponents: adminComponentsProvider,
        reactComponents: reactComponentsProvider,
        reactError: reactErrorProvider,
        typescript: typescriptProvider,
        adminCrudEmbeddedFormSetup: adminCrudEmbeddedFormSetupProvider,
      },
      exports: {
        adminCrudEmbeddedForm: adminCrudEmbeddedFormProvider.export(
          adminCrudSectionScope,
          id,
        ),
      },
      run({
        adminCrudEdit,
        reactComponents,
        reactError,
        typescript,
        adminComponents,
        adminCrudEmbeddedFormSetup: { inputFields, tableColumns },
      }) {
        const capitalizedName = upperCaseFirst(name);
        const formName = `Embedded${capitalizedName}Form`;
        const formDataType = `Embedded${capitalizedName}FormData`;
        const formSchema = `embedded${capitalizedName}FormSchema`;

        const [formImport, formPath] = makeImportAndFilePath(
          `${adminCrudEdit.getDirectoryBase()}/${formName}.tsx`,
        );

        const inputDataDependencies = inputFields.flatMap(
          (f) => f.dataDependencies ?? [],
        );

        const tableName = `Embedded${capitalizedName}Table`;
        const tableDataDependencies = tableColumns.flatMap(
          (f) => f.display.dataDependencies ?? [],
        );

        const allDataDependencies = mergeAdminCrudDataDependencies([
          ...inputDataDependencies,
          ...tableDataDependencies,
        ]);

        const graphQLFields: GraphQLField[] = [
          ...(idField ? [{ name: idField }] : []),
          ...inputFields.flatMap((f) => f.graphQLFields),
          ...tableColumns.flatMap((f) => f.display.graphQLFields),
        ];

        // Create schema
        const validations: AdminCrudInputValidation[] = [
          ...(idField &&
          !inputFields.some((f) => f.validation.some((v) => v.key === idField))
            ? [
                {
                  key: idField,
                  // TODO: Allow non-string IDs
                  expression: new TypescriptCodeExpression(
                    'z.string().nullish()',
                  ),
                },
              ]
            : []),
          ...inputFields.flatMap((f) => f.validation),
        ];
        const embeddedBlock = TypescriptCodeUtils.formatBlock(
          `
  export const SCHEMA_NAME = z.object(SCHEMA_OBJECT);
  
  export type SCHEMA_TYPE = z.infer<typeof SCHEMA_NAME>;
  `,
          {
            SCHEMA_NAME: formSchema,
            SCHEMA_TYPE: formDataType,
            SCHEMA_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
              Object.fromEntries(validations.map((v) => [v.key, v.expression])),
            ),
          },
        ).withHeaderKey(formSchema);

        const validationExpression = TypescriptCodeUtils.createExpression(
          isList ? `z.array(${formSchema})` : formSchema,
          undefined,
          { headerBlocks: [embeddedBlock] },
        );

        return {
          providers: {
            adminCrudEmbeddedForm: {
              getEmbeddedFormInfo: () => {
                const sharedData = {
                  embeddedFormComponent: {
                    expression: TypescriptCodeUtils.createExpression(
                      formName,
                      `import { ${formName} } from '${formImport}'`,
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
                        `import { ${tableName} } from '${formImport}'`,
                      ),
                      extraProps: getPassthroughExtraProps(
                        tableDataDependencies,
                      ),
                    },
                  };
                }
                return {
                  type: 'object',
                  ...sharedData,
                };
              },
            },
          },
          build: async (builder) => {
            const headers = tableColumns.map((column) =>
              TypescriptCodeUtils.createExpression(
                `<Table.HeadCell>${column.label}</Table.HeadCell>`,
              ),
            );
            const cells = tableColumns.map((column) =>
              column.display
                .content('item')
                .wrap((content) => `<Table.Cell>${content}</Table.Cell>`),
            );
            const tableComponent = isList
              ? TypescriptCodeUtils.formatBlock(
                  `
              export function COMPONENT_NAME({
                items,
                edit,
                remove,
                EXTRA_PROP_SPREAD
              }: PROPS): JSX.Element {
              return (
                  <Table className="max-w-6xl">
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
                      tableDataDependencies.map((d) => d.propName).join(',\n'),
                    ),
                    PROPS: getComponentProps({
                      inputType: 'List',
                      componentType: 'Table',
                      formDataType,
                      dataDependencies: tableDataDependencies,
                      adminComponents,
                    }),
                    HEADERS: TypescriptCodeUtils.mergeExpressions(
                      headers,
                      '\n',
                    ),
                    CELLS: TypescriptCodeUtils.mergeExpressions(cells, '\n'),
                  },
                  {
                    importText: [
                      'import {Table, LinkButton} from "%react-components"',
                    ],
                    importMappers: [reactComponents],
                  },
                )
              : new TypescriptCodeBlock('');

            const formFile = typescript.createTemplate(
              {
                EMBEDDED_FORM_DATA_TYPE: TypescriptCodeUtils.createExpression(
                  formDataType,
                  `import { ${formDataType} } from "${adminCrudEdit.getSchemaImport()}`,
                ),
                EMBEDDED_FORM_DATA_SCHEMA: TypescriptCodeUtils.createExpression(
                  formSchema,
                  `import { ${formSchema} } from "${adminCrudEdit.getSchemaImport()}`,
                ),
                COMPONENT_NAME: new TypescriptStringReplacement(formName),
                INPUTS: TypescriptCodeUtils.mergeExpressions(
                  inputFields.map((input) => input.content),
                  '\n',
                ),
                HEADER: TypescriptCodeUtils.mergeBlocks(
                  inputFields.map((field) => field.header).filter(notEmpty),
                ),
                'EXTRA_PROP_SPREAD,': new TypescriptStringReplacement(
                  inputDataDependencies.map((d) => d.propName).join(',\n'),
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
              { importMappers: [reactComponents, reactError] },
            );

            await builder.apply(
              formFile.renderToAction('EmbeddedForm.tsx', formPath),
            );
          },
        };
      },
    }),
  ],
});
