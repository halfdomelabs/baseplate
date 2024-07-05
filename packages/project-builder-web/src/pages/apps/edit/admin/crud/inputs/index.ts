import { adminCrudEmbeddedInputWebConfig } from './embedded-input-config';
import { adminCrudEmbeddedLocalInputWebConfig } from './embedded-local-input-config';
import { adminCrudEnumInputWebConfig } from './enum-input-config';
import { adminCrudForeignInputWebConfig } from './foreign-input-config';
import { adminCrudTextInputWebConfig } from './text-input-config';

export const BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS = [
  adminCrudEmbeddedInputWebConfig,
  adminCrudEmbeddedLocalInputWebConfig,
  adminCrudEnumInputWebConfig,
  adminCrudForeignInputWebConfig,
  adminCrudTextInputWebConfig,
];
