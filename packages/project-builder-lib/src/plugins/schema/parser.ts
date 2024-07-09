/**
 * Zod Plugin Wrapper
 *
 * Used for initializing the zod parsing with plugins
 */

import {
  ParseContext,
  ParseInput,
  ParseReturnType,
  TypeOf,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  input,
} from 'zod';

import { ZodPluginContext, zodPluginSymbol } from './common.js';
import { PluginImplementationStore } from './store.js';

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
  ): ZodPluginWrapper<T> => {
    return new ZodPluginWrapper<T>({
      innerType: type,
      pluginStore,
    });
  };
}

export function zPluginWrapper<T extends ZodTypeAny>(
  type: T,
  pluginStore: PluginImplementationStore,
): ZodPluginWrapper<T> {
  return ZodPluginWrapper.create(type, pluginStore);
}
