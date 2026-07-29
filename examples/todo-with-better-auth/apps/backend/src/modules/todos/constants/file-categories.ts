import { prisma } from '@src/services/prisma.js';

import {
  createFileCategory,
  FileSize,
} from '../../storage/utils/create-file-category.js';
import { todoListPolicy } from '../authorizers/todo-list.policy.js';

export const todoListCoverPhotoFileCategory = createFileCategory({
  adapter: 'uploads',
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  authorize: {
    presignedRead: async (file, context) =>
      (await prisma.todoList.findFirst({
        where: todoListPolicy.actions.read.where(context, {
          coverPhotoId: file.id,
        }),
        select: { id: true },
      })) !== null,
    upload: ({ auth }) => auth.hasSomeRole(['user']),
  },
  maxFileSize: FileSize.MB(10),
  name: 'TODO_LIST_COVER_PHOTO',
  referencedByRelations: ['todoListCoverPhoto'],
});
