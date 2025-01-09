import { flow } from 'es-toolkit';

import type { AdminAppConfig } from '@src/schema/index.js';
import type { ProjectDefinition } from '@src/schema/project-definition.js';

import {
  renameObjectKeyTransform,
  transformJsonPath,
} from './transform-json-path.js';
import { createSchemaMigration } from './types.js';

export const migration009RenameRefs = createSchemaMigration<unknown, unknown>({
  version: 9,
  name: 'renameRefs',
  description: 'Rename zRefs to be suffixed with "Ref"',
  migrate: (config) => {
    // const definition: ProjectDefinition = config;
    // const adminConfig: AdminAppConfig;
    // adminConfig.sections?.[0].form.fields[0];
    const transform = flow(
      (c: unknown) =>
        transformJsonPath(
          c,
          'apps.*.sections.*',
          renameObjectKeyTransform('feature', 'featureRef'),
        ),
      (c) =>
        transformJsonPath(
          c,
          'apps.*.sections.*.form.fields.*',
          renameObjectKeyTransform('localRelationName', 'localRelationRef'),
        ),
      (c) =>
        transformJsonPath(
          c,
          'apps.*.sections.*.embeddedForms.*.form.fields.*',
          renameObjectKeyTransform('localRelationName', 'localRelationRef'),
        ),
    );
    return transform(config);
  },
});
