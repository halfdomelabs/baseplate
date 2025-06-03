import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createProviderType } from '@baseplate-dev/sync';

export interface PothosCustomOption {
  name: string;
  value: TsCodeFragment;
}

export interface PothosFieldProvider {
  addCustomOption(field: PothosCustomOption): void;
}

export const pothosFieldProvider =
  createProviderType<PothosFieldProvider>('pothos-field');
