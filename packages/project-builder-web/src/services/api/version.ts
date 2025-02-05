import type { ClientVersionInfo } from '@halfdomelabs/project-builder-server';

import { IS_PREVIEW } from '../config';
import { trpc } from '../trpc';

export async function getVersionInfo(): Promise<ClientVersionInfo> {
  if (IS_PREVIEW) {
    return {
      version: 'preview',
      featureFlags: [],
    };
  }
  return trpc.version.query();
}
