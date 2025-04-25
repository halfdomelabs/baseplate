import type { ImportMapper } from '@halfdomelabs/core-generators';

import { createProviderType } from '@halfdomelabs/sync';

export interface AuthHooksProvider extends ImportMapper {
  addCurrentUserField: (field: string) => void;
}

export const authHooksProvider =
  createProviderType<AuthHooksProvider>('auth-hooks');
