import type { ClientVersionInfo } from '@baseplate-dev/project-builder-server';

import { IS_PREVIEW } from '../config.js';
import { trpc } from '../trpc.js';

export async function getVersionInfo(): Promise<ClientVersionInfo> {
  if (IS_PREVIEW) {
    return {
      version: 'preview',
      featureFlags: [],
      userConfig: {},
    };
  }
  return trpc.version.get.query();
}
