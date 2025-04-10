export const AVAILABLE_FLAGS = ['TEMPLATE_EXTRACTOR'] as const;

export type FeatureFlag = (typeof AVAILABLE_FLAGS)[number];
