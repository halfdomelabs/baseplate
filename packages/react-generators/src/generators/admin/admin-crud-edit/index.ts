import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { dasherize, underscore } from 'inflection';
import _ from 'lodash';
import { z } from 'zod';
import { reactComponentsProvider } from '@src/generators/core/react-components';
import { reactErrorProvider } from '@src/generators/core/react-error';
import { reactRoutesProvider } from '@src/providers/routes';
import { humanizeCamel, lowerCaseFirst } from '@src/utils/case';
import { createRouteElement } from '@src/utils/routes';
import { mergeGraphQLFields } from '@src/writers/graphql';
import { adminCrudQueriesProvider } from '../admin-crud-queries';
import { adminCrudInputSchema, ADMIN_CRUD_INPUTS } from './inputs';

const descriptorSchema = z.object({
  modelName: z.string(),
  fields: z.array(adminCrudInputSchema),
});

export type AdminCrudEditProvider = unknown;

export const adminCrudEditProvider =
  createProviderType<AdminCrudEditProvider>('admin-crud-edit');

const AdminCrudEditGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    reactRoutes: reactRoutesProvider,
    adminCrudQueries: adminCrudQueriesProvider,
    reactComponents: reactComponentsProvider,
    reactError: reactErrorProvider,
  },
  exports: {
    adminCrudEdit: adminCrudEditProvider,
  },
  createGenerator(
    { modelName, fields },
    { typescript, adminCrudQueries, reactRoutes, reactComponents, reactError }
  ) {
    const [editSchemaImport, editSchemaPath] = makeImportAndFilePath(
      `${reactRoutes.getDirectoryBase()}/edit/${lowerCaseFirst(
        dasherize(underscore(modelName))
      )}-schema.tsx`
    );
    const editSchemaName = `${lowerCaseFirst(modelName)}EditFormSchema`;
    const editSchemaExpression = TypescriptCodeUtils.createExpression(
      editSchemaName,
      `import { ${editSchemaName} } from '${editSchemaImport}';`
    );

    const formDataName = `${modelName}FormData`;
    const formDataExpression = TypescriptCodeUtils.createExpression(
      formDataName,
      `import { ${formDataName} } from '${editSchemaImport}';`
    );

    const [editFormComponentImport, editFormComponentPath] =
      makeImportAndFilePath(
        `${reactRoutes.getDirectoryBase()}/edit/${modelName}EditForm.tsx`
      );
    const editFormComponentName = `${modelName}EditForm`;
    const editFormComponentExpression = new TypescriptCodeExpression(
      editFormComponentName,
      `import ${editFormComponentName} from '${editFormComponentImport}';`
    );

    const [editPageImport, editPagePath] = makeImportAndFilePath(
      `${reactRoutes.getDirectoryBase()}/edit/edit.page.tsx`
    );
    const editPageName = `${modelName}EditPage`;
    reactRoutes.registerRoute({
      path: ':id/edit',
      element: createRouteElement(editPageName, editPageImport),
    });

    const [createPageImport, createPagePath] = makeImportAndFilePath(
      `${reactRoutes.getDirectoryBase()}/edit/create.page.tsx`
    );
    const createPageName = `${modelName}CreatePage`;
    reactRoutes.registerRoute({
      path: 'new',
      element: createRouteElement(createPageName, createPageImport),
    });

    const editQueryInfo = adminCrudQueries.getEditQueryHookInfo();
    const createInfo = adminCrudQueries.getCreateHookInfo();
    const updateInfo = adminCrudQueries.getUpdateHookInfo();

    const renderedInputs = fields.map((field) => {
      const input = ADMIN_CRUD_INPUTS[field.type];
      if (!input) {
        throw new Error(`Unknown input type: ${field.type}`);
      }
      return input.render(field);
    });

    adminCrudQueries.setFormFields(
      mergeGraphQLFields([
        { name: 'id' },
        ...renderedInputs.flatMap((c) => c.graphQLFields),
      ])
    );

    return {
      getProviders: () => ({
        adminCrudEdit: {},
      }),
      build: async (builder) => {
        const validations = renderedInputs.flatMap((c) => c.validation);
        const schemaPage = typescript.createTemplate({
          SCHEMA_NAME: new TypescriptStringReplacement(editSchemaName),
          SCHEMA_OBJECT: TypescriptCodeUtils.mergeExpressionsAsObject(
            _.zipObject(
              validations.map((v) => v.key),
              validations.map((v) => v.expression)
            )
          ),
          FORM_DATA_NAME: new TypescriptStringReplacement(formDataName),
        });
        await builder.apply(
          schemaPage.renderToAction('schema.ts', editSchemaPath)
        );

        const editFormPage = typescript.createTemplate(
          {
            COMPONENT_NAME: new TypescriptStringReplacement(
              editFormComponentName
            ),
            FORM_DATA_NAME: formDataExpression,
            EDIT_SCHEMA: editSchemaExpression,
            INPUTS: TypescriptCodeUtils.mergeExpressions(
              renderedInputs.map((input) => input.content),
              '\n'
            ),
          },
          {
            importMappers: [reactComponents, reactError],
          }
        );
        await builder.apply(
          editFormPage.renderToAction('EditForm.tsx', editFormComponentPath)
        );

        const createPage = typescript.createTemplate(
          {
            COMPONENT_NAME: new TypescriptStringReplacement(createPageName),
            EDIT_FORM: editFormComponentExpression.wrap(
              (content) => `<${content} submitData={submitData} />`
            ),
            CREATE_MUTATION: createInfo.hookExpression,
            MUTATION_NAME: new TypescriptStringReplacement(
              createInfo.fieldName
            ),
            FORM_DATA_NAME: formDataExpression,
            MODEL_NAME: new TypescriptStringReplacement(
              humanizeCamel(modelName)
            ),
            REFETCH_DOCUMENT: adminCrudQueries.getListDocumentExpression(),
          },
          {
            importMappers: [reactComponents, reactError],
          }
        );
        await builder.apply(
          createPage.renderToAction('create.page.tsx', createPagePath)
        );

        const editPage = typescript.createTemplate(
          {
            COMPONENT_NAME: new TypescriptStringReplacement(editPageName),
            GET_EDIT_BY_ID_QUERY: editQueryInfo.hookExpression,
            EDIT_FORM: editFormComponentExpression.wrap(
              (content) =>
                `<${content} submitData={submitData} initialData={initialData} />`
            ),
            UPDATE_MUTATION: updateInfo.hookExpression,
            MUTATION_NAME: new TypescriptStringReplacement(
              updateInfo.fieldName
            ),
            FORM_DATA_NAME: formDataExpression,
            QUERY_FIELD_NAME: new TypescriptStringReplacement(
              editQueryInfo.fieldName
            ),
            MODEL_NAME: new TypescriptStringReplacement(
              humanizeCamel(modelName)
            ),
          },
          {
            importMappers: [reactComponents, reactError],
          }
        );
        await builder.apply(
          editPage.renderToAction('edit.page.tsx', editPagePath)
        );
      },
    };
  },
});

export default AdminCrudEditGenerator;
