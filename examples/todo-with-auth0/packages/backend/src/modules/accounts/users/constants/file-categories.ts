import {
  createFileCategory,
  FileSize,
} from '../../../storage/utils/create-file-category.js';

export const userImageFileFileCategory = createFileCategory({
  adapter: 'uploads',
  authorize: {
    upload: ({ auth }) => auth.hasSomeRole(['user']),
  },
  maxFileSize: FileSize.MB(10),
  name: 'USER_IMAGE_FILE',
  referencedByRelation: 'userImages',
});
export const userProfileAvatarFileCategory = createFileCategory({
  adapter: 'uploads',
  authorize: {
    upload: ({ auth }) => auth.hasSomeRole(['user']),
  },
  maxFileSize: FileSize.MB(10),
  name: 'USER_PROFILE_AVATAR',
  referencedByRelation: 'userProfileAvatar',
});
