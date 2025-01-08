import { createProviderExportScope } from '@halfdomelabs/sync';

export const projectScope = createProviderExportScope(
  'core/project',
  'Scope for the entire project',
);

export const featureScope = createProviderExportScope(
  'core/feature',
  'Scope for a specific feature',
);

export const fileScope = createProviderExportScope(
  'core/file',
  'Scope for a specific file',
);
