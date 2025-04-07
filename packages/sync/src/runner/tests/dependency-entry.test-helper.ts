import type { EntryDependencyRecord } from '../dependency-map.js';

export function createDependencyEntry({
  id,
  providerName,
  isOutput,
  isReadOnly,
}: {
  id: string;
  providerName: string;
  isOutput?: boolean;
  isReadOnly?: boolean;
}): EntryDependencyRecord {
  return {
    id,
    providerName,
    isOutput: isOutput ?? false,
    isReadOnly: isReadOnly ?? false,
  };
}

export function createReadOnlyDependencyEntry({
  id,
  providerName,
}: {
  id: string;
  providerName: string;
}): EntryDependencyRecord {
  return createDependencyEntry({ id, providerName, isReadOnly: true });
}

export function createOutputDependencyEntry({
  id,
  providerName,
}: {
  id: string;
  providerName: string;
}): EntryDependencyRecord {
  return createDependencyEntry({
    id,
    providerName,
    isOutput: true,
    isReadOnly: true,
  });
}
