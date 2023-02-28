import { TypescriptCodeExpression } from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';

export interface PothosCustomOption {
  name: string;
  value: TypescriptCodeExpression;
}

export interface PothosFieldProvider {
  addCustomOption(field: PothosCustomOption): void;
}

export const pothosFieldProvider =
  createProviderType<PothosFieldProvider>('pothos-field');
