// @ts-nocheck

import './global-types';
import './schema-builder';
import SchemaBuilder, { BasePlugin, SchemaTypes } from '@pothos/core';

export * from './types';

export const pothosFieldWithInputPayloadPlugin = 'fieldWithInputPayload';

export class PothosFieldWithInputPayloadPlugin<
  Types extends SchemaTypes,
> extends BasePlugin<Types> {}

SchemaBuilder.registerPlugin(
  pothosFieldWithInputPayloadPlugin,
  PothosFieldWithInputPayloadPlugin,
);
