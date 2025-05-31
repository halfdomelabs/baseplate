import type { FeatureFlag } from '@baseplate-dev/project-builder-lib';

import { useClientVersion } from './useClientVersion.js';

/**
 * Hook to check if a feature flag is enabled
 *
 * @param flag - The feature flag to check
 * @returns Whether the feature flag is enabled
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { featureFlags } = useClientVersion();
  return featureFlags.includes(flag);
}
