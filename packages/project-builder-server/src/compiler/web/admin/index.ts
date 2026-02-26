import type { WebAppConfig } from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { AppEntryBuilder } from '../../app-entry-builder.js';

import { compileAdminFeatures } from './sections.js';

// Export the admin features compilation for use by the web compiler
export function compileAdminSections(
  builder: AppEntryBuilder<WebAppConfig>,
): GeneratorBundle[] | undefined {
  const { adminApp } = builder.appConfig;

  if (!adminApp.enabled) {
    return undefined;
  }

  return compileAdminFeatures(builder);
}
