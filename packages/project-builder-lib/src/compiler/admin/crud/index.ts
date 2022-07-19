import inflection from 'inflection';
import { AppEntryBuilder } from '@src/compiler/appEntryBuilder';
import { AdminAppConfig, AdminCrudSectionConfig } from '@src/schema';
import { compileAdminCrudDisplay } from './displays';
import { compileAdminCrudInput } from './inputs';

export function compileAdminCrudSection(
  crudSection: AdminCrudSectionConfig,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  return {
    name: inflection.camelize(crudSection.name.replace(' ', ''), true),
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
                compileAdminCrudInput(field, crudSection.modelName, builder)
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
