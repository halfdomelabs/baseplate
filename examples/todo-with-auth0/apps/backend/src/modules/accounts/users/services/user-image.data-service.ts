import { z } from 'zod';

import type {
  GetPayload,
  ModelQuery,
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
  TQueryArgs extends ModelQuery<'userImage'> = ModelQuery<'userImage'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'userImage', TQueryArgs>): Promise<
  GetPayload<'userImage', TQueryArgs>
> {
  return commitDelete({
    model: 'userImage',
    where,
    query,
    context,
    execute: async ({ tx, where, query }) =>
      await tx.userImage.delete({
        where,
        ...query,
      }),
  });
}
