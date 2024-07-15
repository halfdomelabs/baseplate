export const AVAILABLE_FLAGS = [] as const;

export type FeatureFlag = (typeof AVAILABLE_FLAGS)[number];
