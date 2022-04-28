// @ts-nocheck
import { plugin } from 'nexus';

/**
 * Nexus doesn't have a good error message when a type is missing
 * (Error: NEXUS__UNKNOWN__TYPE was already defined and imported as a type, check the docs for extending types)
 *
 * Therefore, this plugin makes it more explicit what type is missing
 */
export const missingTypePlugin = plugin({
  name: 'missingTypePlugin',
  onMissingType(typeName, builder) {
    throw new Error(`GraphQL schema is missing type ${typeName}`);
  },
});
