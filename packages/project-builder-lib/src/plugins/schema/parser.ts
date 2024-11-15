/**
 * Zod Plugin Wrapper
 *
 * Used for initializing the zod parsing with plugins
 */

import type {
  input,
  ParseContext,
  ParseInput,
  ParseReturnType,
  TypeOf,
  ZodTypeAny,
  ZodTypeDef,
} from 'zod';

import { ZodType } from 'zod';

import type { ZodPluginContext } from './common.js';
import type { PluginImplementationStore } from './store.js';

import { zodPluginSymbol } from './common.js';

export interface ZodPluginWrapperDef<T extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  innerType: T;
  pluginStore: PluginImplementationStore;
}

export class ZodPluginWrapper<T extends ZodTypeAny> extends ZodType<
  TypeOf<T>,
  ZodPluginWrapperDef<T>,
  input<T>
> {
  _parse(input: ParseInput): ParseReturnType<TypeOf<T>> {
    // run builder
    const pluginContext: ZodPluginContext = {
      pluginStore: this._def.pluginStore,
    };

    return this._def.innerType._parse({
      ...input,
      parent: {
        ...input.parent,
        common: {
          ...input.parent.common,
          [zodPluginSymbol]: pluginContext,
        },
      } as ParseContext,
    });
  }

  static create = <T extends ZodTypeAny>(
    type: T,
    pluginStore: PluginImplementationStore,
  ): ZodPluginWrapper<T> =>
    new ZodPluginWrapper<T>({
      innerType: type,
      pluginStore,
    });
}

export function zPluginWrapper<T extends ZodTypeAny>(
  type: T,
  pluginStore: PluginImplementationStore,
): ZodPluginWrapper<T> {
  return ZodPluginWrapper.create(type, pluginStore);
}
