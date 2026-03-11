import { z } from 'zod';

import type {
  GetPayload,
  ModelInclude,
} from '@src/utils/data-operations/prisma-types.js';
import type { DataDeleteInput } from '@src/utils/data-operations/types.js';

import { commitDelete } from '@src/utils/data-operations/commit-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';

import { fileField } from '../../../storage/services/file-field.js';
import { userImageFileFileCategory } from '../constants/file-categories.js';

export const userImageInputFields = {
  id: scalarField(z.uuid().optional()),
  caption: scalarField(z.string()),
  file: fileField({
    category: userImageFileFileCategory,
    fileIdFieldName: 'fileId',
  }),
};

export async function deleteUserImage<
  TIncludeArgs extends ModelInclude<'userImage'> = ModelInclude<'userImage'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'userImage', TIncludeArgs>): Promise<
  GetPayload<'userImage', TIncludeArgs>
> {
  return commitDelete({
    model: 'userImage',
    query,
    context,
    execute: async ({ tx, query }) => {
      const item = await tx.userImage.delete({
        where,
        ...query,
      });
      return item;
    },
  });
}
