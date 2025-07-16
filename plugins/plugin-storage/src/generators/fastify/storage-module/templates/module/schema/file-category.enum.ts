// @ts-nocheck

import { FILE_CATEGORIES } from '$configCategories';
import { builder } from '%pothosImports';

export const fileCategoryEnumType = builder.enumType('FileCategory', {
  values: Object.values(FILE_CATEGORIES).map((category) => category.name),
});
