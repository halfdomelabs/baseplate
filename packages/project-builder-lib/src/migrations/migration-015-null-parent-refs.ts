import { createSchemaMigration } from './types.js';

interface OldConfig {
  features?: {
    id: string;
    name: string;
    parentRef: string | null | undefined;
  }[];
}

interface NewConfig {
  features?: {
    id: string;
    name: string;
    parentRef: string | undefined;
  }[];
}

export const migration015NullParentRefs = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 15,
  name: 'nullParentRefs',
  description: 'Convert null parentRefs to undefined in features',
  migrate: (config) => {
    if (!config.features) {
      return config as NewConfig;
    }

    const features = config.features.map((feature) => ({
      ...feature,
      parentRef: feature.parentRef ?? undefined,
    }));

    return {
      ...config,
      features,
    } as NewConfig;
  },
});
