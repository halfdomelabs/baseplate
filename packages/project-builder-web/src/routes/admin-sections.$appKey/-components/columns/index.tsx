import type { AdminCrudColumnWebConfig } from '@baseplate-dev/project-builder-lib/web';

import { createAdminCrudColumnWebConfig } from '@baseplate-dev/project-builder-lib/web';
import { adminCrudColumnEntityType } from '@baseplate-dev/project-builder-lib';

import { ForeignColumnForm } from './foreign-column-form.js';
import { TextColumnForm } from './text-column-form.js';

export const BUILT_IN_ADMIN_CRUD_COLUMN_WEB_CONFIGS: AdminCrudColumnWebConfig[] =
  [
    createAdminCrudColumnWebConfig({
      name: 'text',
      pluginKey: undefined,
      label: 'Text Column',
      isAvailableForModel: (definition, modelId) => {
        // Text columns are always available if the model has fields
        const model = definition.models.find((m) => m.id === modelId);
        return model?.model.fields.length > 0;
      },
      Form: TextColumnForm,
      getNewColumn: () => ({
        id: adminCrudColumnEntityType.generateNewId(),
        type: 'text',
        label: '',
        modelFieldRef: '',
      }),
    }),
    createAdminCrudColumnWebConfig({
      name: 'foreign',
      pluginKey: undefined,
      label: 'Foreign Column',
      isAvailableForModel: (definition, modelId) => {
        // Foreign columns are available if the model has relations
        const model = definition.models.find((m) => m.id === modelId);
        return model?.model.relations?.length > 0;
      },
      Form: ForeignColumnForm,
      getNewColumn: () => ({
        id: adminCrudColumnEntityType.generateNewId(),
        type: 'foreign',
        label: '',
        localRelationRef: '',
        labelExpression: '',
        valueExpression: '',
      }),
    }),
  ];

export * from './foreign-column-form.js';
export * from './text-column-form.js';
