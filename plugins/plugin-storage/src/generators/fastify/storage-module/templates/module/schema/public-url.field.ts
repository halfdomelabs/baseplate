// @ts-nocheck

import { getPublicUrl } from '$servicesGetPublicUrl';
import { builder } from '%pothosImports';

builder.objectField(TPL_FILE_OBJECT_TYPE, 'publicUrl', (t) =>
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
