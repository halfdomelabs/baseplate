import { prisma } from '@src/services/prisma.js';

import {
  createFileCategory,
  FileSize,
} from '../../../storage/utils/create-file-category.js';
import { userProfilePolicy } from '../authorizers/user-profile.policy.js';

export const userImageFileFileCategory = createFileCategory({
  adapter: 'uploads',
  authorize: { upload: ({ auth }) => auth.hasSomeRole(['user']) },
  maxFileSize: FileSize.MB(10),
  name: 'USER_IMAGE_FILE',
  referencedByRelations: ['userImages'],
});
export const userProfileAvatarFileCategory = createFileCategory({
  adapter: 'uploads',
  authorize: {
    presignedRead: async (file, context) =>
      await (async () => {
        const row = await prisma.userProfile.findFirst({
          where: userProfilePolicy.actions.read.where(context, {
            avatarId: file.id,
          }),
        });
        if (!row) return false;
        return await userProfilePolicy.roles.owner.check(context, row);
      })(),
    upload: ({ auth }) => auth.hasSomeRole(['user']),
  },
  maxFileSize: FileSize.MB(10),
  name: 'USER_PROFILE_AVATAR',
  referencedByRelations: ['userProfileAvatar'],
});
