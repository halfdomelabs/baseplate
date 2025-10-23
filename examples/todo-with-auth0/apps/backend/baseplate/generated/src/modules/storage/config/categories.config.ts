import type { FileCategory } from '../types/file-category.js';

import {
  userImageFileFileCategory,
  userProfileAvatarFileCategory,
} from '../../accounts/users/constants/file-categories.js';
import { todoListCoverPhotoFileCategory } from '../../todos/constants/file-categories.js';

// Collected registry for all file categories
export const FILE_CATEGORIES = /* TPL_FILE_CATEGORIES:START */ [
  todoListCoverPhotoFileCategory,
  userImageFileFileCategory,
  userProfileAvatarFileCategory,
] /* TPL_FILE_CATEGORIES:END */ as const;

// Type-safe category lookup
export type FileCategoryName = (typeof FILE_CATEGORIES)[number]['name'];

// Helper function for services
export function getCategoryByName(name: string): FileCategory | undefined {
  return FILE_CATEGORIES.find((c) => c.name === name);
}

// Helper function with error throwing
export function getCategoryByNameOrThrow(name: string): FileCategory {
  const category = getCategoryByName(name);
  if (!category) {
    throw new Error(`File category ${name} not found.`);
  }
  return category;
}
