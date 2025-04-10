export const AVAILABLE_FLAGS = ['BASEPLATE_TEMPLATE_EXTRACTOR'] as const;

export type FeatureFlag = (typeof AVAILABLE_FLAGS)[number];
