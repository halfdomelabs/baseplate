import { builder } from '@src/plugins/graphql/builder.js';

import { getPublicUrl } from '../services/get-public-url.js';
import { fileObjectType } from './file.object-type.js';

builder.objectField(
  /* TPL_FILE_OBJECT_TYPE:START */ fileObjectType /* TPL_FILE_OBJECT_TYPE:END */,
  'publicUrl',
  (t) =>
    t.string({
      description:
        'URL of the file where it is publicly hosted. Returns null if it is not publicly available.',
      nullable: true,
      resolve: async (file) => {
        const url = await getPublicUrl(file);
        return url ?? null;
      },
    }),
);
