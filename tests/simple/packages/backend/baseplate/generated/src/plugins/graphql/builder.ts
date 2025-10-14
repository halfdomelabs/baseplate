import type PrismaTypes from '@pothos/plugin-prisma/generated';

import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import RelayPlugin from '@pothos/plugin-relay';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import TracingPlugin, { isRootField } from '@pothos/plugin-tracing';
import { createSentryWrapper } from '@pothos/tracing-sentry';

import type { RequestServiceContext } from '@src/utils/request-service-context.js';

import { prisma } from '@src/services/prisma.js';

import { pothosFieldWithInputPayloadPlugin } from './FieldWithInputPayloadPlugin/index.js';
import { pothosStripQueryMutationPlugin } from './strip-query-mutation-plugin.js';

const traceResolver = createSentryWrapper({
  includeSource: true,
  ignoreError: true,
});

export const builder = new SchemaBuilder<{
  Context: RequestServiceContext;
  DefaultEdgesNullability: false;
  DefaultFieldNullability: false;
  PrismaTypes: PrismaTypes;
  Scalars: {
    Date: { Input: Date; Output: Date | string };
    DateTime: { Input: Date; Output: Date | string };
    JSON: { Input: unknown; Output: unknown };
    JSONObject: {
      Input: Record<string, unknown>;
      Output: Record<string, unknown>;
    };
    Uuid: { Input: string; Output: string };
  };
}>({
  defaultFieldNullability: false,
  plugins: [
    PrismaPlugin,
    TracingPlugin,
    pothosFieldWithInputPayloadPlugin,
    pothosStripQueryMutationPlugin,
    RelayPlugin,
    SimpleObjectsPlugin,
  ],
  prisma: {
    client: prisma,
    exposeDescriptions: false,
    filterConnectionTotalCount: true,
  },
  relay: {
    clientMutationId: 'omit',
    cursorType: 'String',
    edgesFieldOptions: { nullable: false },
  },
  tracing: {
    default: (config) => isRootField(config),
    wrap: (resolver, options) => traceResolver(resolver, options),
  },
});

builder.queryType();
builder.mutationType();
