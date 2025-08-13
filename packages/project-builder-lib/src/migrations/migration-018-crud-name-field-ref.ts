import { createSchemaMigration } from './types.js';

interface OldConfig {
  models?: {
    id: string;
    name: string;
    model: {
      fields: {
        id: string;
        name: string;
        [key: string]: unknown;
      }[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  apps?: {
    id: string;
    type: string;
    name: string;
    adminApp?: {
      sections?: {
        id: string;
        name: string;
        type: string;
        modelRef?: string;
        nameFieldRef?: string;
        [key: string]: unknown;
      }[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

interface NewConfig {
  models?: {
    id: string;
    name: string;
    model: {
      fields: {
        id: string;
        name: string;
        [key: string]: unknown;
      }[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  apps?: {
    id: string;
    type: string;
    name: string;
    adminApp?: {
      sections?: {
        id: string;
        name: string;
        type: string;
        modelRef?: string;
        nameFieldRef?: string;
        [key: string]: unknown;
      }[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

export const migration018CrudNameFieldRef = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 18,
  name: 'crudNameFieldRef',
  description:
    'Add nameFieldRef to CRUD sections, defaulting to name, title, id, or first field',
  migrate: (config) => {
    if (!config.apps || !config.models) {
      return config as NewConfig;
    }

    const apps = config.apps.map((app) => {
      // Only process apps with adminApp and sections
      if (!app.adminApp?.sections) {
        return app;
      }

      const sections = app.adminApp.sections.map((section) => {
        // Only process CRUD sections without nameFieldRef
        if (section.type !== 'crud' || section.nameFieldRef) {
          return section;
        }

        // Find the model for this section
        const model = config.models?.find((m) => m.name === section.modelRef);
        if (!model?.model.fields || model.model.fields.length === 0) {
          throw new Error(`Model ${section.modelRef} has no fields`);
        }

        // Find field by priority: name, title, id, then first field
        let selectedField = model.model.fields.find((f) => f.name === 'name');
        selectedField ??= model.model.fields.find((f) => f.name === 'title');
        selectedField ??= model.model.fields.find((f) => f.name === 'id');
        selectedField ??= model.model.fields[0];

        return {
          ...section,
          nameFieldRef: selectedField.name,
        };
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
