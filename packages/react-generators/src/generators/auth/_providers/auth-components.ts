import type { ImportMapper } from '@halfdomelabs/core-generators';

import { createProviderType } from '@halfdomelabs/sync';

export type AuthComponentsProvider = ImportMapper;

export const authComponentsProvider =
  createProviderType<AuthComponentsProvider>('auth-components');
