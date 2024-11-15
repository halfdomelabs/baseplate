import type {
  input,
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
  ): ZodWithPlugins<T> =>
    new ZodWithPlugins<T>({
      getter,
    });
}

export function zWithPlugins<T extends ZodTypeAny>(
  getter: (plugins: PluginImplementationStore, data: unknown) => T,
): ZodWithPlugins<T> {
  return ZodWithPlugins.create(getter);
}
