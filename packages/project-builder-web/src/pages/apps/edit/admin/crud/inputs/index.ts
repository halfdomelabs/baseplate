import { adminCrudEmbeddedInputWebConfig } from './embedded-input-config.js';
import { adminCrudEmbeddedLocalInputWebConfig } from './embedded-local-input-config.js';
import { adminCrudEnumInputWebConfig } from './enum-input-config.js';
import { adminCrudForeignInputWebConfig } from './foreign-input-config.js';
import { adminCrudTextInputWebConfig } from './text-input-config.js';

export const BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS = [
  adminCrudEmbeddedInputWebConfig,
  adminCrudEmbeddedLocalInputWebConfig,
  adminCrudEnumInputWebConfig,
  adminCrudForeignInputWebConfig,
  adminCrudTextInputWebConfig,
];
