import { createProviderType } from '@halfdomelabs/sync';
import { PothosTypeReference } from '@src/writers/pothos/index.js';

export interface PothosTypeOutputProvider {
  getTypeReference(): PothosTypeReference;
}

export const pothosTypeOutputProvider =
  createProviderType<PothosTypeOutputProvider>('pothos-type-output', {
    isReadOnly: true,
  });
