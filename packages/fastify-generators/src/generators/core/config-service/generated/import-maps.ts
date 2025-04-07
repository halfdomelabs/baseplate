import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMapProvider,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';

const configServiceImportMapSchema = createTsImportMapSchema({
  config: {},
});

type ConfigServiceImportMapProvider = TsImportMapProviderFromSchema<
  typeof configServiceImportMapSchema
>;

export const configServiceImportsProvider =
  createReadOnlyProviderType<ConfigServiceImportMapProvider>(
    'config-service-imports',
  );

interface ConfigServiceFileMap {
  service: string;
}

export function createConfigServiceImportMap(
  filePaths: ConfigServiceFileMap,
): ConfigServiceImportMapProvider {
  return createTsImportMapProvider(configServiceImportMapSchema, {
    config: filePaths.service,
  });
}
