import { z } from 'zod';

import type {
  GetPayload,
  ModelQuery,
} from '@src/utils/data-operations/prisma-types.js';
import type { DataDeleteInput } from '@src/utils/data-operations/types.js';

import { commitDelete } from '@src/utils/data-operations/commit-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';

import { fileField } from '../../../storage/services/file-field.js';
import { userProfileAvatarFileCategory } from '../constants/file-categories.js';

export const userProfileInputFields = {
  id: scalarField(z.uuid().optional()),
  bio: scalarField(z.string().nullish()),
  birthDay: scalarField(z.date().nullish()),
  favoriteTodoListId: scalarField(z.uuid().nullish()),
  avatar: fileField({
    category: userProfileAvatarFileCategory,
    fileIdFieldName: 'avatarId',
    optional: true,
  }),
};

export async function deleteUserProfile<
  TQueryArgs extends ModelQuery<'userProfile'> = ModelQuery<'userProfile'>,
>({
  where,
  query,
  context,
}: DataDeleteInput<'userProfile', TQueryArgs>): Promise<
  GetPayload<'userProfile', TQueryArgs>
> {
  return commitDelete({
    model: 'userProfile',
    where,
    query,
    context,
    execute: async ({ tx, where, query }) => {
      const item = await tx.userProfile.delete({
        where,
        ...query,
      });
      return item;
    },
  });
}
