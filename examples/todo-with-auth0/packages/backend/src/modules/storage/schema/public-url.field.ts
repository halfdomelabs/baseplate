import { builder } from '@src/plugins/graphql/builder.js';

import type { StorageAdapterKey } from '../config/adapters.config.js';

import { STORAGE_ADAPTERS } from '../config/adapters.config.js';
import { fileObjectType } from './file.object-type.js';

builder.objectField(
  /* TPL_FILE_OBJECT_TYPE:START */ fileObjectType /* TPL_FILE_OBJECT_TYPE:END */,
  'publicUrl',
  (t) =>
    t.string({
      description:
        'URL of the file where it is publicly hosted. Returns null if it is not publicly available.',
      nullable: true,
      resolve: ({ adapter: adapterName, storagePath }) => {
        if (!(adapterName in STORAGE_ADAPTERS)) {
          throw new Error(`Unknown adapter ${adapterName}`);
        }
        const adapter = STORAGE_ADAPTERS[adapterName as StorageAdapterKey];
        return adapter.getPublicUrl?.(storagePath) ?? null;
      },
    }),
);
