import { createSchemaMigration } from './types.js';

interface OldColumnConfig {
  id?: string;
  label: string;
  display: {
    type: 'text' | 'foreign';
    modelFieldRef?: string;
    localRelationRef?: string;
    labelExpression?: string;
    valueExpression?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface NewColumnConfig {
  id?: string;
  type: string;
  label: string;
  modelFieldRef?: string;
  localRelationRef?: string;
  labelExpression?: string;
  valueExpression?: string;
  [key: string]: unknown;
}

interface OldConfig {
  apps?: {
    id: string;
    type: string;
    name: string;
    adminApp?: {
      sections?: {
        id: string;
        name: string;
        type: string;
        table?: {
          columns?: OldColumnConfig[];
          [key: string]: unknown;
        };
        embeddedForms?: {
          id: string;
          name: string;
          type: string;
          table?: {
            columns?: OldColumnConfig[];
            [key: string]: unknown;
          };
          [key: string]: unknown;
        }[];
        [key: string]: unknown;
      }[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

interface NewConfig {
  apps?: {
    id: string;
    type: string;
    name: string;
    adminApp?: {
      sections?: {
        id: string;
        name: string;
        type: string;
        table?: {
          columns?: NewColumnConfig[];
          [key: string]: unknown;
        };
        embeddedForms?: {
          id: string;
          name: string;
          type: string;
          table?: {
            columns?: NewColumnConfig[];
            [key: string]: unknown;
          };
          [key: string]: unknown;
        }[];
        [key: string]: unknown;
      }[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

function migrateColumn(oldColumn: OldColumnConfig): NewColumnConfig {
  const { display, id, ...rest } = oldColumn;

  return {
    id: id?.replace('admin-crud-section-column', 'admin-crud-column'),
    ...rest,
    type: display.type,
    ...(display.modelFieldRef && { modelFieldRef: display.modelFieldRef }),
    ...(display.localRelationRef && {
      localRelationRef: display.localRelationRef,
    }),
    ...(display.labelExpression && {
      labelExpression: display.labelExpression,
    }),
    ...(display.valueExpression && {
      valueExpression: display.valueExpression,
    }),
  };
}

function migrateColumns(
  columns?: OldColumnConfig[],
): NewColumnConfig[] | undefined {
  if (!columns || columns.length === 0) {
    return [];
  }

  return columns.map(migrateColumn);
}

export const migration019ColumnTypeBased = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 19,
  name: 'columnTypeBased',
  description:
    'Migrate admin CRUD columns from display-based to type-based structure',
  migrate: (config) => {
    if (!config.apps) {
      return config as NewConfig;
    }

    const apps = config.apps.map((app) => {
      // Only process apps with adminApp and sections
      if (!app.adminApp?.sections) {
        return app;
      }

      const sections = app.adminApp.sections.map((section) => {
        const updatedSection = { ...section };

        // Migrate main table columns
        if (section.table?.columns) {
          updatedSection.table = {
            ...section.table,
            columns: migrateColumns(
              section.table.columns,
            ) as unknown as OldColumnConfig[],
          };
        }

        // Migrate embedded form table columns
        if (section.embeddedForms) {
          updatedSection.embeddedForms = section.embeddedForms.map((form) => {
            if (form.table?.columns) {
              return {
                ...form,
                table: {
                  ...form.table,
                  columns: migrateColumns(
                    form.table.columns,
                  ) as unknown as OldColumnConfig[],
                },
              };
            }
            return form;
          });
        }

        return updatedSection;
      });

      return {
        ...app,
        adminApp: {
          ...app.adminApp,
          sections,
        },
      };
    });

    return {
      ...config,
      apps,
    } as NewConfig;
  },
});
