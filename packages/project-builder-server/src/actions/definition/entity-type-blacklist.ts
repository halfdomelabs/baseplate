/**
 * Entity types that are blocked from generic entity operations
 * (list-entity-types, stage-create, stage-update, stage-delete).
 *
 * Plugins require special lifecycle handling (migrations, implementation
 * store setup) and must be managed via the dedicated plugin actions
 * (configure-plugin, disable-plugin).
 */
export const BLACKLISTED_ENTITY_TYPES = new Set(['plugin']);

/**
 * Throws an error if the given entity type is blacklisted.
 */
export function assertEntityTypeNotBlacklisted(entityTypeName: string): void {
  if (BLACKLISTED_ENTITY_TYPES.has(entityTypeName)) {
    throw new Error(
      `Entity type "${entityTypeName}" cannot be managed via generic entity operations. ` +
        'Use configure-plugin or disable-plugin instead.',
    );
  }
}
