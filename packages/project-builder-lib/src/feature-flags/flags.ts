export const AVAILABLE_FLAGS = ['plugins'] as const;

export type FeatureFlag = (typeof AVAILABLE_FLAGS)[number];
