import { createGenerator } from '@baseplate-dev/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

/**
 * Generates the native notification backend module (service, GraphQL API, and
 * real-time pubsub wiring) into the application's notifications feature.
 *
 * NOTE: Templates are authored against a generated example app via the Baseplate
 * dev MCP server (`extract-templates` / `generate-templates`). This generator is
 * currently a scaffold; the template tasks are wired in once extracted.
 */
export const notificationModuleGenerator = createGenerator({
  name: 'notifications/core/notification-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({}),
});
