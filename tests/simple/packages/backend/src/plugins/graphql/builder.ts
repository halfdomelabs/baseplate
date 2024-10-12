import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import RelayPlugin from '@pothos/plugin-relay';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import TracingPlugin, { isRootField } from '@pothos/plugin-tracing';
import { createSentryWrapper } from '@pothos/tracing-sentry';
import { prisma } from '@src/services/prisma.js';
import { RequestServiceContext } from '@src/utils/request-service-context.js';
import { pothosFieldWithInputPayloadPlugin } from './FieldWithInputPayloadPlugin/index.js';
import { pothosStripQueryMutationPlugin } from './stripQueryMutationPlugin.js';

const traceResolver = createSentryWrapper({
  includeSource: true,
  ignoreError: true,
});

export const builder = new SchemaBuilder<{
  Context: RequestServiceContext;
  Scalars: {
    Uuid: { Input: string; Output: string };
    DateTime: { Input: Date; Output: Date | string };
    Date: { Input: Date; Output: Date | string };
  };
  DefaultEdgesNullability: false;
  DefaultFieldNullability: false;
  PrismaTypes: PrismaTypes;
}>({
  plugins: [
    pothosFieldWithInputPayloadPlugin,
    pothosStripQueryMutationPlugin,
    SimpleObjectsPlugin,
    RelayPlugin,
    TracingPlugin,
    PrismaPlugin,
  ],
  relay: {
    clientMutationId: 'omit',
    cursorType: 'String',
    edgesFieldOptions: { nullable: false },
  },
  defaultFieldNullability: false,
  tracing: {
    default: (config) => isRootField(config),
    wrap: (resolver, options) => traceResolver(resolver, options),
  },
  prisma: {
    client: prisma,
    exposeDescriptions: false,
    filterConnectionTotalCount: true,
  },
});

builder.queryType();
builder.mutationType();
