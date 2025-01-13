import type {
  AdminAppConfig,
  AdminCrudEmbeddedFormConfig,
  AdminCrudSectionConfig,
} from '@halfdomelabs/project-builder-lib';

import {
  ModelUtils,
  stripEmptyGeneratorChildren,
} from '@halfdomelabs/project-builder-lib';
import inflection from 'inflection';

import type { AppEntryBuilder } from '@src/compiler/app-entry-builder.js';

import { compileAdminCrudDisplay } from './displays.js';
import { compileAdminCrudInput } from './inputs.js';

function compileAdminCrudEmbeddedForm(
  builder: AppEntryBuilder<AdminAppConfig>,
  form: AdminCrudEmbeddedFormConfig,
  crudSectionId: string,
): Record<string, unknown> {
  const idFields = ModelUtils.byIdOrThrow(
    builder.projectDefinition,
    form.modelRef,
  ).model.primaryKeyFieldRefs.map((ref) => builder.nameFromId(ref));
  if (form.includeIdField && idFields.length !== 1) {
    throw new Error(
      `Embedded form ${builder.nameFromId(form.modelRef)} has ${idFields.length} primary keys, but only one is allowed`,
    );
  }
  const sharedData = {
    id: form.id,
    name: form.name,
    modelName: builder.nameFromId(form.modelRef),
    // auto-add id field if it's a single ID
    idField: form.includeIdField ? idFields[0] : undefined,
  };

  if (form.type === 'list') {
    return {
      ...sharedData,
      isList: true,
      children: {
        columns: form.table.columns.map((c) => ({
          generator: '@halfdomelabs/react/admin/admin-crud-column',
          name: c.label,
          label: c.label,
          children: {
            display: compileAdminCrudDisplay(builder, c.display, form.modelRef),
          },
        })),
        inputs: form.form.fields.map((field) =>
          compileAdminCrudInput(field, form.modelRef, builder, crudSectionId),
        ),
      },
    };
  }
  return {
    ...sharedData,
    isList: false,
    children: {
      inputs: form.form.fields.map((field) =>
        compileAdminCrudInput(field, form.modelRef, builder, crudSectionId),
      ),
    },
  };
}

export function compileAdminCrudSection(
  crudSection: AdminCrudSectionConfig,
  builder: AppEntryBuilder<AdminAppConfig>,
  parentId: string,
): Record<string, unknown> {
  const sectionName = inflection.camelize(
    crudSection.name.replaceAll(' ', '_'),
    true,
  );
  const crudSectionId = `${parentId}.${sectionName}.$section`;
  return {
    name: sectionName,
    generator: '@halfdomelabs/react/core/react-routes',
    children: {
      $section: {
        generator: '@halfdomelabs/react/admin/admin-crud-section',
        modelName: builder.nameFromId(crudSection.modelRef),
        disableCreate: crudSection.disableCreate,
        children: {
          edit: {
            children: stripEmptyGeneratorChildren({
              inputs: crudSection.form.fields.map((field) =>
                compileAdminCrudInput(
                  field,
                  crudSection.modelRef,
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
                    crudSection.modelRef,
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
