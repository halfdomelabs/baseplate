// @ts-nocheck

import './global-types.js';
import './schema-builder.js';
import SchemaBuilder, { BasePlugin, SchemaTypes } from '@pothos/core';

export * from './types.js';

export const pothosFieldWithInputPayloadPlugin = 'fieldWithInputPayload';

export class PothosFieldWithInputPayloadPlugin<
  Types extends SchemaTypes,
> extends BasePlugin<Types> {}

SchemaBuilder.registerPlugin(
  pothosFieldWithInputPayloadPlugin,
  PothosFieldWithInputPayloadPlugin,
);
