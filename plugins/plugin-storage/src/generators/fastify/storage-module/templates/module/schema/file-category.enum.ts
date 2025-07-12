// @ts-nocheck

import { builder } from '%pothosImports';

import { FILE_CATEGORIES } from '../config/categories.config.js';

export const fileCategoryEnumType = builder.enumType('FileCategory', {
  values: Object.values(FILE_CATEGORIES).map((category) => category.name),
});
