import { TypescriptCodeExpression } from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';

export interface PothosCustomField {
  name: string;
  value: TypescriptCodeExpression;
}

export interface PothosTypeProvider {
  addCustomField(field: PothosCustomField): void;
}

export const pothosTypeProvider =
  createProviderType<PothosTypeProvider>('pothos-type');
