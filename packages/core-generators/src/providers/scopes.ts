import { createProviderExportScope } from '@baseplate-dev/sync';

export const packageScope = createProviderExportScope(
  'core/project',
  'Scope for the entire project',
);

export const featureScope = createProviderExportScope(
  'core/feature',
  'Scope for a specific feature',
);
