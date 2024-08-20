import { useMemo } from 'react';
import { z } from 'zod';

import { useProjectDefinition } from './useProjectDefinition.js';
import { ZodPluginWrapper, zPluginWrapper } from '@src/plugins/index.js';

export function usePluginEnhancedSchema<T extends z.ZodTypeAny>(
  schema: T,
): ZodPluginWrapper<T> {
  const { pluginContainer } = useProjectDefinition();
  return useMemo(() => {
    return zPluginWrapper(schema, pluginContainer);
  }, [schema, pluginContainer]);
}
