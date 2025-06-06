import { createReadOnlyProviderType } from '@baseplate-dev/sync';

import type { PothosTypeReference } from '#src/writers/pothos/index.js';

/**
 * A provider that provides a Pothos type reference.
 */
export interface PothosTypeOutputProvider {
  /**
   * Get the Pothos type reference.
   */
  getTypeReference(): PothosTypeReference;
}

/**
 * A provider that provides a Pothos type reference.
 */
export const pothosTypeOutputProvider =
  createReadOnlyProviderType<PothosTypeOutputProvider>('pothos-type-output');
