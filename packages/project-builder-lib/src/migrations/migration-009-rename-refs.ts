import { flow } from 'es-toolkit';

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
    const transform = flow((c: unknown) =>
      transformJsonPath(
        c,
        'apps.*.sections.*',
        renameObjectKeyTransform('feature', 'featureRef'),
      ),
    );
    return transform(config);
  },
});
