import type {
  AdminCrudEmbeddedFormConfig,
  AdminCrudSectionConfig,
  WebAppConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { ModelUtils } from '@baseplate-dev/project-builder-lib';
import {
  adminCrudEditGenerator,
  adminCrudEmbeddedFormGenerator,
  adminCrudListGenerator,
  adminCrudSectionGenerator,
  reactRoutesGenerator,
} from '@baseplate-dev/react-generators';
import inflection from 'inflection';

import type { AppEntryBuilder } from '#src/compiler/app-entry-builder.js';

import { compileAdminCrudAction } from './actions.js';
import { compileAdminCrudColumn } from './columns.js';
import { compileAdminCrudInput } from './inputs.js';

function compileAdminCrudEmbeddedForm(
  builder: AppEntryBuilder<WebAppConfig>,
  form: AdminCrudEmbeddedFormConfig,
  crudSectionDefinition: AdminCrudSectionConfig,
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
        columns: form.table.columns.map((column, idx) =>
          compileAdminCrudColumn(
            column,
            form.modelRef,
            builder,
            crudSectionDefinition,
            idx,
          ),
        ),
        inputs: form.form.fields.map((field, idx) =>
          compileAdminCrudInput(
            field,
            form.modelRef,
            builder,
            crudSectionDefinition.id,
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
          crudSectionDefinition.id,
          idx,
        ),
      ),
    },
  });
}

export function compileAdminCrudSection(
  crudSection: AdminCrudSectionConfig,
  builder: AppEntryBuilder<WebAppConfig>,
  parentId: string,
): GeneratorBundle {
  const sectionName = inflection.camelize(
    crudSection.name.replaceAll(' ', '_'),
    true,
  );
  const crudSectionId = `${parentId}.${sectionName}.$section`;
  const modelName = builder.nameFromId(crudSection.modelRef);
  const { disableCreate } = crudSection;

  const model = ModelUtils.byIdOrThrow(
    builder.projectDefinition,
    crudSection.modelRef,
  );
  const idFieldRefs = model.model.primaryKeyFieldRefs;
  if (idFieldRefs.length !== 1) {
    throw new Error(
      `Section ${crudSection.name} has ${idFieldRefs.length} primary keys, but only one is allowed`,
    );
  }
  const idField = idFieldRefs[0];
  const idFieldType = model.model.fields.find(
    (field) => field.id === idFieldRefs[0],
  )?.type;
  if (!idFieldType || (idFieldType !== 'uuid' && idFieldType !== 'string')) {
    throw new Error(
      `Section ${crudSection.name} has a primary key that is not a Uuid or String`,
    );
  }

  return reactRoutesGenerator({
    name: sectionName,
    children: {
      section: adminCrudSectionGenerator({
        children: {
          edit: adminCrudEditGenerator({
            modelId: crudSection.modelRef,
            modelName,
            disableCreate,
            nameField: builder.nameFromId(crudSection.nameFieldRef),
            idField,
            idFieldGraphqlType: idFieldType === 'uuid' ? 'Uuid' : 'String',
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
                compileAdminCrudEmbeddedForm(builder, form, crudSection),
              ),
            },
          }),
          list: adminCrudListGenerator({
            modelId: crudSection.modelRef,
            modelName,
            disableCreate,
            children: {
              columns: crudSection.table.columns.map((column, idx) =>
                compileAdminCrudColumn(
                  column,
                  crudSection.modelRef,
                  builder,
                  crudSection,
                  idx,
                ),
              ),
              actions: crudSection.table.actions?.map((action, idx) =>
                compileAdminCrudAction(
                  action,
                  crudSection.modelRef,
                  builder,
                  crudSection,
                  idx,
                ),
              ),
            },
          }),
        },
      }),
    },
  });
}
