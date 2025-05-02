import type {
  AdminAppConfig,
  AdminCrudEmbeddedFormConfig,
  AdminCrudSectionConfig,
} from '@halfdomelabs/project-builder-lib';

import { ModelUtils } from '@halfdomelabs/project-builder-lib';
import {
  adminCrudColumnGenerator,
  adminCrudEditGenerator,
  adminCrudEmbeddedFormGenerator,
  adminCrudListGenerator,
  adminCrudQueriesGenerator,
  adminCrudSectionGenerator,
  reactRoutesGenerator,
} from '@halfdomelabs/react-generators';
import { type GeneratorBundle, makeIdSafe } from '@halfdomelabs/sync';
import inflection from 'inflection';

import type { AppEntryBuilder } from '@src/compiler/app-entry-builder.js';

import { compileAdminCrudDisplay } from './displays.js';
import { compileAdminCrudInput } from './inputs.js';

function compileAdminCrudEmbeddedForm(
  builder: AppEntryBuilder<AdminAppConfig>,
  form: AdminCrudEmbeddedFormConfig,
  crudSectionId: string,
): GeneratorBundle {
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
    return adminCrudEmbeddedFormGenerator({
      ...sharedData,
      isList: true,
      children: {
        columns: form.table.columns.map((c) =>
          adminCrudColumnGenerator({
            // TODO: We should use an actual ID on the column
            id: makeIdSafe(c.label),
            label: c.label,
            children: {
              display: compileAdminCrudDisplay(
                builder,
                c.display,
                form.modelRef,
              ),
            },
          }),
        ),
        inputs: form.form.fields.map((field, idx) =>
          compileAdminCrudInput(
            field,
            form.modelRef,
            builder,
            crudSectionId,
            idx,
          ),
        ),
      },
    });
  }
  return adminCrudEmbeddedFormGenerator({
    ...sharedData,
    isList: false,
    children: {
      inputs: form.form.fields.map((field, idx) =>
        compileAdminCrudInput(
          field,
          form.modelRef,
          builder,
          crudSectionId,
          idx,
        ),
      ),
    },
  });
}

export function compileAdminCrudSection(
  crudSection: AdminCrudSectionConfig,
  builder: AppEntryBuilder<AdminAppConfig>,
  parentId: string,
): GeneratorBundle {
  const sectionName = inflection.camelize(
    crudSection.name.replaceAll(' ', '_'),
    true,
  );
  const crudSectionId = `${parentId}.${sectionName}.$section`;
  const modelName = builder.nameFromId(crudSection.modelRef);
  const { disableCreate } = crudSection;
  return reactRoutesGenerator({
    id: crudSection.id,
    name: sectionName,
    children: {
      section: adminCrudSectionGenerator({
        children: {
          edit: adminCrudEditGenerator({
            modelId: crudSection.modelRef,
            modelName,
            disableCreate,
            children: {
              inputs: crudSection.form.fields.map((field, idx) =>
                compileAdminCrudInput(
                  field,
                  crudSection.modelRef,
                  builder,
                  crudSectionId,
                  idx,
                ),
              ),
              embeddedForms: crudSection.embeddedForms?.map((form) =>
                compileAdminCrudEmbeddedForm(builder, form, crudSectionId),
              ),
            },
          }),
          list: adminCrudListGenerator({
            modelId: crudSection.modelRef,
            modelName,
            disableCreate,
            children: {
              columns: crudSection.table.columns.map((column) =>
                adminCrudColumnGenerator({
                  // TODO: We should use an actual ID on the column
                  id: makeIdSafe(column.label),
                  label: column.label,
                  children: {
                    display: compileAdminCrudDisplay(
                      builder,
                      column.display,
                      crudSection.modelRef,
                    ),
                  },
                }),
              ),
            },
          }),
          queries: adminCrudQueriesGenerator({
            modelId: crudSection.modelRef,
            modelName,
          }),
        },
      }),
    },
  });
}
