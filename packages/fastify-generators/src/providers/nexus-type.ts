import { TypescriptCodeExpression } from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';

export interface NexusTypeProvider {
  addCustomField(name: string, value: TypescriptCodeExpression): void;
}

export const nexusTypeProvider =
  createProviderType<NexusTypeProvider>('nexus-type');
