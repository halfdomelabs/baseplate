// @ts-nocheck

import { builder } from '%pothosImports';

/**
 * File category names for the GraphQL enum, generated statically from the
 * same category definitions as `AppModule.storageCategories`. Listed
 * directly rather than derived from `rootModule` at schema-build time -
 * enum values are needed before `storageModule` (which contains this file)
 * has finished loading, so reading through the module tree here would be
 * circular.
 */
export const FILE_CATEGORY_ENUM_NAMES = TPL_FILE_CATEGORY_ENUM_NAMES;

export const fileCategoryEnumType = builder.enumType('FileCategory', {
  values: FILE_CATEGORY_ENUM_NAMES,
});
