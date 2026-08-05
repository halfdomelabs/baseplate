// @ts-nocheck

import type { SchemaTypes } from '@pothos/core';

import SchemaBuilder, { BasePlugin } from '@pothos/core';

import '$fieldWithInputGlobalTypes';
import '$fieldWithInputSchemaBuilder';

export type * from './types.js';

export const pothosFieldWithInputPayloadPlugin = 'fieldWithInputPayload';

export class PothosFieldWithInputPayloadPlugin<
  Types extends SchemaTypes,
> extends BasePlugin<Types> {}

SchemaBuilder.registerPlugin(
  pothosFieldWithInputPayloadPlugin,
  PothosFieldWithInputPayloadPlugin,
);
