// @ts-nocheck

import { builder } from '%pothos';
import { STORAGE_ADAPTERS, StorageAdapterKey } from '../constants/adapters';
import { FILE_OBJECT_TYPE } from 'FILE_OBJECT_MODULE';

builder.objectField(FILE_OBJECT_TYPE, 'hostedUrl', (t) =>
  t.string({
    description:
      'URL of the file where it is publicly hosted. Returns null if it is not publicly available.',
    nullable: true,
    resolve: ({ adapter: adapterName, path }) => {
      const adapter = STORAGE_ADAPTERS[adapterName as StorageAdapterKey];
      if (!adapter) {
        throw new Error(`Unknown adapter ${adapterName}`);
      }
      return adapter?.getHostedUrl?.(path) || null;
    },
  })
);
