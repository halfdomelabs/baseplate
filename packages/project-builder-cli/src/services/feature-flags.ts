import {
  FeatureFlag,
  AVAILABLE_FLAGS,
} from '@halfdomelabs/project-builder-lib';

/**
 * Feature flags allow you to enable / disable features in development via environment
 * variables. Set FEATURE_FLAGS=<FEATURES> to enable features.
 */
export function getEnabledFeatureFlags(): FeatureFlag[] {
  const featuresEnv = process.env.FEATURE_FLAGS;
  if (!featuresEnv) {
    return [];
  }

  return featuresEnv
    .split(',')
    .filter((feature): feature is FeatureFlag =>
      AVAILABLE_FLAGS.includes(feature as FeatureFlag),
    );
}
