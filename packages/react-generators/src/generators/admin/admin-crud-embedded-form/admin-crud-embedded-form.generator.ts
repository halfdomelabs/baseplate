import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsTemplate,
  tsTypeImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createReadOnlyProviderType,
} from '@halfdomelabs/sync';
import { notEmpty } from '@halfdomelabs/utils';
import { posixJoin } from '@halfdomelabs/utils/node';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import type { GraphQLField } from '@src/writers/graphql/index.js';

import { reactComponentsImportsProvider } from '@src/generators/core/react-components/react-components.generator.js';
import { reactErrorImportsProvider } from '@src/generators/core/react-error/react-error.generator.js';
import { upperCaseFirst } from '@src/utils/case.js';

import type { AdminCrudColumn } from '../_providers/admin-crud-column-container.js';
import type {
  AdminCrudInput,
  AdminCrudInputValidation,
} from '../_providers/admin-crud-input-container.js';
import type { AdminCrudDataDependency } from '../_utils/data-loaders.js';
import type { AdminComponentsImportsProvider } from '../admin-components/admin-components.generator.js';

import { adminCrudColumnContainerProvider } from '../_providers/admin-crud-column-container.js';
import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';
import {
  getPassthroughExtraProps,
  mergeAdminCrudDataDependencies,
} from '../_utils/data-loaders.js';
import { adminComponentsImportsProvider } from '../admin-components/admin-components.generator.js';
import { adminCrudEditProvider } from '../admin-crud-edit/admin-crud-edit.generator.js';
import { adminCrudSectionScope } from '../admin-crud-section/admin-crud-section.generator.js';
import { ADMIN_ADMIN_CRUD_EMBEDDED_FORM_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  id: z.string(),
  name: z.string(),
  isList: z.boolean(),
  modelName: z.string(),
  idField: z.string().optional(),
});

interface AdminCrudEmbeddedComponent {
  expression: TsCodeFragment;
  extraProps: string;
}

interface AdminCrudEmbeddedObjectFormInfo {
  type: 'object';
  embeddedFormComponent: AdminCrudEmbeddedComponent;
  dataDependencies: AdminCrudDataDependency[];
  graphQLFields: GraphQLField[];
  validationExpression: TsCodeFragment;
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
  adminComponentsImports,
}: {
  inputType: 'Object' | 'List';
  componentType: 'Form' | 'Table';
  formDataType: string;
  dataDependencies: AdminCrudDataDependency[];
  adminComponentsImports: AdminComponentsImportsProvider;
}): TsCodeFragment {
  const defaultProps = `Embedded${inputType}${componentType}Props` as const;

  // actually not sure why it's not supported here but it doesn't exist
  if (defaultProps === 'EmbeddedObjectTableProps') {
    throw new Error('EmbeddedObjectTableProps is not supported');
  }

  const defaultPropsImport =
    adminComponentsImports[defaultProps].typeFragment();
  const defaultPropsExpression = tsTemplate`${defaultPropsImport}<${formDataType}>`;
  if (dataDependencies.length === 0) {
    return defaultPropsExpression;
  }

  const propsName = `${componentType}Props`;

  return tsCodeFragment(propsName, undefined, {
    hoistedFragments: [
      tsHoistedFragment(
        propsName,
        TsCodeUtils.formatFragment(
          `
        interface PROPS_NAME extends DEFAULT_PROPS {
          INTERFACE_CONTENT
        }`,
          {
            PROPS_NAME: propsName,
            DEFAULT_PROPS: defaultPropsExpression,
            INTERFACE_CONTENT: TsCodeUtils.mergeFragmentsAsInterfaceContent(
              Object.fromEntries(
                dataDependencies.map((d): [string, TsCodeFragment] => [
                  d.propName,
                  d.propType,
                ]),
              ),
            ),
          },
        ),
      ),
    ],
  });
}

const adminCrudEmbeddedFormSetupProvider = createReadOnlyProviderType<{
  inputFields: AdminCrudInput[];
  tableColumns: AdminCrudColumn[];
}>('admin-crud-embedded-form-setup');

export const adminCrudEmbeddedFormGenerator = createGenerator({
  name: 'admin/admin-crud-embedded-form',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.id,
  buildTasks: ({ id, name, modelName, isList, idField }) => ({
    setupForm: createGeneratorTask({
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
            adminCrudEmbeddedFormSetup: {
              inputFields: inputFields.sort((a, b) => a.order - b.order),
              tableColumns: tableColumns.sort((a, b) => a.order - b.order),
            },
          }),
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        adminCrudEdit: adminCrudEditProvider,
        adminComponentsImports: adminComponentsImportsProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        reactErrorImports: reactErrorImportsProvider,
        typescriptFile: typescriptFileProvider,
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
        reactComponentsImports,
        reactErrorImports,
        typescriptFile,
        adminComponentsImports,
        adminCrudEmbeddedFormSetup: { inputFields, tableColumns },
      }) {
        const capitalizedName = upperCaseFirst(name);
        const formName = `Embedded${capitalizedName}Form`;
        const formDataType = `Embedded${capitalizedName}FormData`;
        const formSchema = `embedded${capitalizedName}FormSchema`;

        const formPath = posixJoin(
          adminCrudEdit.getDirectoryBase(),
          `${formName}.tsx`,
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
                  expression: tsCodeFragment('z.string().nullish()'),
                },
              ]
            : []),
          ...inputFields.flatMap((f) => f.validation),
        ];
        const embeddedBlock = tsHoistedFragment(
          formSchema,
          TsCodeUtils.formatFragment(
            `
  export const TPL_SCHEMA_NAME = z.object(TPL_SCHEMA_OBJECT);
  
  export type TPL_SCHEMA_TYPE = z.infer<typeof TPL_SCHEMA_NAME>;
  `,
            {
              TPL_SCHEMA_NAME: formSchema,
              TPL_SCHEMA_TYPE: formDataType,
              TPL_SCHEMA_OBJECT: TsCodeUtils.mergeFragmentsAsObject(
                Object.fromEntries(
                  validations.map((v) => [v.key, v.expression]),
                ),
              ),
            },
          ),
        );

        const validationExpression = tsCodeFragment(
          isList ? `z.array(${formSchema})` : formSchema,
          undefined,
          { hoistedFragments: [embeddedBlock] },
        );

        return {
          providers: {
            adminCrudEmbeddedForm: {
              getEmbeddedFormInfo: () => {
                const sharedData = {
                  embeddedFormComponent: {
                    expression: TsCodeUtils.importFragment(formName, formPath),
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
                      expression: TsCodeUtils.importFragment(
                        tableName,
                        formPath,
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
              tsCodeFragment(
                `<Table.HeadCell>${column.label}</Table.HeadCell>`,
              ),
            );
            const cells = tableColumns.map(
              (column) =>
                tsTemplate`<Table.Cell>${column.display.content('item')}</Table.Cell>`,
            );
            const tableComponent = isList
              ? TsCodeUtils.formatFragment(
                  `
              export function TPL_COMPONENT_NAME({
                items,
                edit,
                remove,
                TPL_EXTRA_PROP_SPREAD
              }: TPL_PROPS): ReactElement {
              return (
                  <Table className="max-w-6xl">
                    <Table.Head>
                      <Table.HeadRow>
                        TPL_HEADERS
                        <Table.HeadCell>Actions</Table.HeadCell>
                      </Table.HeadRow>
                    </Table.Head>
                    <Table.Body>
                      {items.map((item, idx) => (
                        <Table.Row key={item.id}>
                          TPL_CELLS
                          <Table.Cell className="space-x-4">
                            <LinkButton onClick={() => {
                              edit(idx);
                            }}>Edit</LinkButton>
                            <LinkButton negative onClick={() => {
                              remove(idx);
                            }}>
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
                    TPL_COMPONENT_NAME: tableName,
                    TPL_EXTRA_PROP_SPREAD: tableDataDependencies
                      .map((d) => d.propName)
                      .join(',\n'),
                    TPL_PROPS: getComponentProps({
                      inputType: 'List',
                      componentType: 'Table',
                      formDataType,
                      dataDependencies: tableDataDependencies,
                      adminComponentsImports,
                    }),
                    TPL_HEADERS: TsCodeUtils.mergeFragmentsPresorted(
                      headers,
                      '\n',
                    ),
                    TPL_CELLS: TsCodeUtils.mergeFragmentsPresorted(cells, '\n'),
                  },
                  [
                    reactComponentsImports.Table.declaration(),
                    reactComponentsImports.LinkButton.declaration(),
                    tsTypeImportBuilder(['ReactElement']).from('react'),
                  ],
                )
              : tsCodeFragment('');

            const sortedInputFields = sortBy(inputFields, [(f) => f.order]);

            await builder.apply(
              typescriptFile.renderTemplateFile({
                id: `embedded-form-${id}`,
                template:
                  ADMIN_ADMIN_CRUD_EMBEDDED_FORM_TS_TEMPLATES.embeddedForm,
                destination: formPath,
                variables: {
                  TPL_EMBEDDED_FORM_DATA_TYPE: TsCodeUtils.typeImportFragment(
                    formDataType,
                    adminCrudEdit.getSchemaImport(),
                  ),
                  TPL_EMBEDDED_FORM_DATA_SCHEMA: TsCodeUtils.importFragment(
                    formSchema,
                    adminCrudEdit.getSchemaImport(),
                  ),
                  TPL_COMPONENT_NAME: formName,
                  TPL_INPUTS: TsCodeUtils.mergeFragmentsPresorted(
                    sortedInputFields.map((input) => input.content),
                    '\n',
                  ),
                  TPL_HEADER: TsCodeUtils.mergeFragmentsPresorted(
                    sortedInputFields
                      .map((field) => field.header)
                      .filter(notEmpty),
                  ),
                  TPL_DESTRUCTURED_PROPS: `{
                      initialData,
                      onSubmit,
                      ${inputDataDependencies
                        .map((d) => d.propName)
                        .join(',\n')}
                    }`,
                  TPL_PROPS: getComponentProps({
                    inputType: isList ? 'List' : 'Object',
                    componentType: 'Form',
                    formDataType,
                    dataDependencies: inputDataDependencies,
                    adminComponentsImports,
                  }),
                  TPL_TABLE_COMPONENT: tableComponent,
                },
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
