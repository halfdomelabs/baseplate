import { createProviderExportScope } from '@halfdomelabs/sync';

export const projectScope = createProviderExportScope(
  '@core/project',
  'The JS/TS Project scope',
);

export const featureScope = createProviderExportScope(
  '@core/feature',
  'The Feature scope',
);
