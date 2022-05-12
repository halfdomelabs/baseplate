// @ts-nocheck

import type { Config } from '@jest/types';

// Scripts can use console
/* eslint-disable no-console */

export default async function setup(
  globalConfig: Config.GlobalConfig
): Promise<void> {
  CUSTOM_SETUP;
}
