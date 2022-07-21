import inflection from 'inflection';
import { AppEntryBuilder } from '@src/compiler/appEntryBuilder';
import {
  AdminAppConfig,
  AdminCrudEmbeddedFormConfig,
  AdminCrudSectionConfig,
} from '@src/schema';
import { compileAdminCrudDisplay } from './displays';
import { compileAdminCrudInput } from './inputs';

function compileAdminCrudEmbeddedForm(
  form: AdminCrudEmbeddedFormConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>,
  crudSectionId: string
): unknown {
  const idFields = builder.parsedProject.getModelPrimaryKeys(form.modelName);
  if (form.includeIdField && idFields.length !== 1) {
    throw new Error(
      `Embedded form ${form.modelName} has ${idFields.length} primary keys, but only one is allowed`
    );
  }
  const sharedData = {
    name: form.name,
    modelName: form.modelName,
    // auto-add id field if it's a single ID
    idField: form.includeIdField ? idFields[0] : undefined,
  };

  if (form.type === 'list') {
    return {
      ...sharedData,
      isList: true,
      children: {
        columns: form.table?.columns.map((c) => ({
          generator: '@baseplate/react/admin/admin-crud-column',
          name: c.label,
          label: c.label,
          children: {
            display: compileAdminCrudDisplay(
              c.display,
              form.modelName,
              builder
            ),
          },
        })),
        inputs: form.form.fields.map((field) =>
          compileAdminCrudInput(field, form.modelName, builder, crudSectionId)
        ),
      },
    };
  }
  return {
    ...sharedData,
    isList: false,
    children: {
      inputs: form.form.fields.map((field) =>
        compileAdminCrudInput(field, form.modelName, builder, crudSectionId)
      ),
    },
  };
}

export function compileAdminCrudSection(
  crudSection: AdminCrudSectionConfig,
  builder: AppEntryBuilder<AdminAppConfig>,
  parentId: string
): unknown {
  const sectionName = inflection.camelize(
    crudSection.name.replace(' ', ''),
    true
  );
  const crudSectionId = `${parentId}.${sectionName}.$section`;
  return {
    name: sectionName,
    generator: '@baseplate/react/core/react-routes',
    children: {
      $section: {
        generator: '@baseplate/react/admin/admin-crud-section',
        modelName: crudSection.modelName,
        disableCreate: crudSection.disableCreate,
        children: {
          edit: {
            children: {
              inputs: crudSection.form.fields.map((field) =>
                compileAdminCrudInput(
                  field,
                  crudSection.modelName,
                  builder,
                  crudSectionId
                )
              ),
              embeddedForms: crudSection.embeddedForms?.map((form) =>
                compileAdminCrudEmbeddedForm(
                  form,
                  crudSection.modelName,
                  builder,
                  crudSectionId
                )
              ),
            },
          },
          list: {
            children: {
              columns: crudSection.table.columns.map((column) => ({
                name: column.label.replace(' ', '_'),
                label: column.label,
                children: {
                  display: compileAdminCrudDisplay(
                    column.display,
                    crudSection.modelName,
                    builder
                  ),
                },
              })),
            },
          },
        },
      },
    },
  };
}
