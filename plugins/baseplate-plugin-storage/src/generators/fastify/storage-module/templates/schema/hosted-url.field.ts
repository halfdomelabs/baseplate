// @ts-nocheck

import { builder } from '%pothosImports';

import { STORAGE_ADAPTERS, StorageAdapterKey } from '../constants/adapters.js';

builder.objectField(TPL_FILE_OBJECT_TYPE, 'hostedUrl', (t) =>
  t.string({
    description:
      'URL of the file where it is publicly hosted. Returns null if it is not publicly available.',
    nullable: true,
    resolve: ({ adapter: adapterName, path }) => {
      const adapter = STORAGE_ADAPTERS[adapterName as StorageAdapterKey];
      if (!adapter) {
        throw new Error(`Unknown adapter ${adapterName}`);
      }
      return adapter?.getHostedUrl?.(path) ?? null;
    },
  }),
);
