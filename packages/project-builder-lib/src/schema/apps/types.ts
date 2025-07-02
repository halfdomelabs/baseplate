import { createEntityType } from '#src/references/types.js';

export const appEntityType = createEntityType('app');

export type AppEntryType<AppEntryDefinition> = string & {
  __brand?: AppEntryDefinition;
};

export function createAppEntryType<AppEntryDefinition>(
  name: string,
): AppEntryType<AppEntryDefinition> {
  return name;
}
