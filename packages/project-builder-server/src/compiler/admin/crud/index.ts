import {
  AdminAppConfig,
  AdminCrudEmbeddedFormConfig,
  AdminCrudSectionConfig,
  stripChildren,
} from '@halfdomelabs/project-builder-lib';
import inflection from 'inflection';

import { compileAdminCrudDisplay } from './displays.js';
import { compileAdminCrudInput } from './inputs.js';
import { AppEntryBuilder } from '@src/compiler/appEntryBuilder.js';

function compileAdminCrudEmbeddedForm(
  builder: AppEntryBuilder<AdminAppConfig>,
  form: AdminCrudEmbeddedFormConfig,
  crudSectionId: string,
): unknown {
  const idFields = builder.parsedProject.getModelPrimaryKeys(form.modelName);
  if (form.includeIdField && idFields.length !== 1) {
    throw new Error(
      `Embedded form ${form.modelName} has ${idFields.length} primary keys, but only one is allowed`,
    );
  }
  const sharedData = {
    name: form.name,
    modelName: builder.nameFromId(form.modelName),
    // auto-add id field if it's a single ID
    idField: form.includeIdField ? idFields[0] : undefined,
  };

  if (form.type === 'list') {
    return {
      ...sharedData,
      isList: true,
      children: {
        columns: form.table?.columns.map((c) => ({
          generator: '@halfdomelabs/react/admin/admin-crud-column',
          name: c.label,
          label: c.label,
          children: {
            display: compileAdminCrudDisplay(
              builder,
              c.display,
              form.modelName,
            ),
          },
        })),
        inputs: form.form.fields.map((field) =>
          compileAdminCrudInput(field, form.modelName, builder, crudSectionId),
        ),
      },
    };
  }
  return {
    ...sharedData,
    isList: false,
    children: {
      inputs: form.form.fields.map((field) =>
        compileAdminCrudInput(field, form.modelName, builder, crudSectionId),
      ),
    },
  };
}

export function compileAdminCrudSection(
  crudSection: AdminCrudSectionConfig,
  builder: AppEntryBuilder<AdminAppConfig>,
  parentId: string,
): unknown {
  const sectionName = inflection.camelize(
    crudSection.name.replace(/ /g, '_'),
    true,
  );
  const crudSectionId = `${parentId}.${sectionName}.$section`;
  return {
    name: sectionName,
    generator: '@halfdomelabs/react/core/react-routes',
    children: {
      $section: {
        generator: '@halfdomelabs/react/admin/admin-crud-section',
        modelName: builder.nameFromId(crudSection.modelName),
        disableCreate: crudSection.disableCreate,
        children: {
          edit: {
            children: stripChildren({
              inputs: crudSection.form.fields.map((field) =>
                compileAdminCrudInput(
                  field,
                  crudSection.modelName,
                  builder,
                  crudSectionId,
                ),
              ),
              embeddedForms: crudSection.embeddedForms?.map((form) =>
                compileAdminCrudEmbeddedForm(builder, form, crudSectionId),
              ),
            }),
          },
          list: {
            children: {
              columns: crudSection.table.columns.map((column) => ({
                name: column.label.replace(' ', '_'),
                label: column.label,
                children: {
                  display: compileAdminCrudDisplay(
                    builder,
                    column.display,
                    crudSection.modelName,
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
