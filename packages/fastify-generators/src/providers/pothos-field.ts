import { TypescriptCodeExpression } from '@halfdomelabs/core-generators';
import { createProviderType } from '@halfdomelabs/sync';

export interface PothosCustomOption {
  name: string;
  value: TypescriptCodeExpression;
}

export interface PothosFieldProvider {
  addCustomOption(field: PothosCustomOption): void;
}

export const pothosFieldProvider =
  createProviderType<PothosFieldProvider>('pothos-field');
