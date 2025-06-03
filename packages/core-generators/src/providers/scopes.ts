import { createProviderExportScope } from '@baseplate-dev/sync';

export const projectScope = createProviderExportScope(
  'core/project',
  'Scope for the entire project',
);

export const featureScope = createProviderExportScope(
  'core/feature',
  'Scope for a specific feature',
);
