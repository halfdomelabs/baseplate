// @ts-nocheck

import SchemaBuilder from '@pothos/core';

export const builder = new SchemaBuilder<{ SCHEMA_TYPE_OPTIONS }>(
  SCHEMA_BUILDER_OPTIONS
);

builder.queryType();
builder.mutationType();
builder.subscriptionType();
