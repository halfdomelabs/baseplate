import { TypescriptCodeExpression } from '@halfdomelabs/core-generators';
import { createProviderType } from '@halfdomelabs/sync';

export interface NexusTypeProvider {
  addCustomField(name: string, value: TypescriptCodeExpression): void;
}

export const nexusTypeProvider =
  createProviderType<NexusTypeProvider>('nexus-type');
