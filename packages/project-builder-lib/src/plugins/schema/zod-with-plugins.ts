import {
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

interface ZodPluginExtendedContext {
  [zodPluginSymbol]?: ZodPluginContext;
}

export interface ZodWithPluginsDef<T extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  getter: (plugins: PluginImplementationStore, data: unknown) => T;
}

export class ZodWithPlugins<T extends ZodTypeAny> extends ZodType<
  TypeOf<T>,
  ZodWithPluginsDef<T>,
  input<T>
> {
  _parse(input: ParseInput): ParseReturnType<TypeOf<T>> {
    const context = input.parent.common as ZodPluginExtendedContext;
    // run builder
    const zodPluginContext = context[zodPluginSymbol];
    if (!zodPluginContext) {
      throw new Error(`Spec must be run within a Zod plugin context`);
    }

    const innerType = this._def.getter(
      zodPluginContext.pluginStore,
      input.data,
    );

    return innerType._parse(input);
  }

  static create = <T extends ZodTypeAny>(
    getter: (plugins: PluginImplementationStore, data: unknown) => T,
  ): ZodWithPlugins<T> => {
    return new ZodWithPlugins<T>({
      getter,
    });
  };
}

export function zWithPlugins<T extends ZodTypeAny>(
  getter: (plugins: PluginImplementationStore, data: unknown) => T,
): ZodWithPlugins<T> {
  return ZodWithPlugins.create(getter);
}
