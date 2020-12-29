/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormatterProvider } from '../providers/formatter';

export type PostActionCallback = () => Promise<void>;

export interface ActionContext {
  currentDirectory: string;
  generatorDirectory: string;
  formatter?: FormatterProvider | null;
  addPostActionCallback(callback: PostActionCallback): void;
}

export interface Action<Options = any> {
  name: string;
  options: Options;
  execute: (context: ActionContext) => Promise<void>;
}

export function createActionCreator<Options>(
  name: string,
  execute: (options: Options, context: ActionContext) => Promise<void>
): (options: Options) => Action<Options> {
  return (options) => ({
    name,
    options,
    execute: (context: ActionContext) => execute(options, context),
  });
}
