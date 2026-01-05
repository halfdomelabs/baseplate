import { createEntityType } from '#src/references/types.js';

export const packageEntityType = createEntityType('package');

export type PackageEntryType<PackageEntryDefinition> = string & {
  __brand?: PackageEntryDefinition;
};

export function createPackageEntryType<PackageEntryDefinition>(
  name: string,
): PackageEntryType<PackageEntryDefinition> {
  return name;
}
