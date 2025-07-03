import { DefinitionReferenceMarker } from './markers.js';

/**
 * Strips the DefinitionReferenceMarker from the value recursively.
 * @param value - The value to strip the DefinitionReferenceMarker from.
 * @returns The value without the DefinitionReferenceMarker.
 */
export function stripRefMarkers<TInput = unknown>(value: TInput): TInput {
  if (value instanceof DefinitionReferenceMarker) {
    return value.value as TInput;
  }

  if (Array.isArray(value)) {
    return value.map(stripRefMarkers) as TInput;
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [
        key,
        stripRefMarkers(childValue),
      ]),
    ) as TInput;
  }

  return value;
}
