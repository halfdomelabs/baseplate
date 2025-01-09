import type { ImportMapper } from '@halfdomelabs/core-generators';

import { createProviderType } from '@halfdomelabs/sync';

export type UserSessionServiceProvider = ImportMapper;

export const userSessionServiceProvider =
  createProviderType<UserSessionServiceProvider>('user-session-service');
