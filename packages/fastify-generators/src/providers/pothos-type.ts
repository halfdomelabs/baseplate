import { createProviderType } from '@halfdomelabs/sync';
import { PothosTypeReference } from '@src/writers/pothos';

export interface PothosTypeOutputProvider {
  getTypeReference(): PothosTypeReference;
}

export const pothosTypeOutputProvider =
  createProviderType<PothosTypeOutputProvider>('pothos-type-output', {
    isReadOnly: true,
  });
