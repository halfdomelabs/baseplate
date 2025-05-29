import type { z } from 'zod';

import { useMemo } from 'react';

import type { ZodPluginWrapper } from '#src/plugins/index.js';

import { zPluginWrapper } from '#src/plugins/index.js';

import { useProjectDefinition } from './useProjectDefinition.js';

export function usePluginEnhancedSchema<T extends z.ZodTypeAny>(
  schema: T,
): ZodPluginWrapper<T> {
  const { pluginContainer } = useProjectDefinition();
  return useMemo(
    () => zPluginWrapper(schema, pluginContainer),
    [schema, pluginContainer],
  );
}
