import type { FeatureFlag } from '@halfdomelabs/project-builder-lib';

import { useClientVersion } from './useClientVersion';

export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { featureFlags } = useClientVersion();
  return featureFlags.includes(flag);
}
