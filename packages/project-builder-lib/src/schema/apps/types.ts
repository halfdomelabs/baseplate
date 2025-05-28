import { createEntityType } from '#src/references/index.js';

export const appEntityType = createEntityType('app');

export type AppEntryType<AppEntryDefinition> = string & {
  __brand?: AppEntryDefinition;
};

export function createAppEntryType<AppEntryDefinition>(
  name: string,
): AppEntryType<AppEntryDefinition> {
  return name;
}
