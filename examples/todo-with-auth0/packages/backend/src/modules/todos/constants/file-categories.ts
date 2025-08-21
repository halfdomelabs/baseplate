import {
  createFileCategory,
  FileSize,
} from '../../storage/utils/create-file-category.js';

export const todoListCoverPhotoFileCategory = createFileCategory({
  adapter: 'uploads',
  authorize: {
    upload: ({ auth }) => auth.hasSomeRole(['user']),
  },
  maxFileSize: FileSize.MB(10),
  name: 'TODO_LIST_COVER_PHOTO',
  referencedByRelation: 'todoListCoverPhoto',
});
