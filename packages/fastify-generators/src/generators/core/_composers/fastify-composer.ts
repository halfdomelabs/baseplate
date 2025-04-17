import type {
  GeneratorBundle,
  InferDescriptorFromGenerator,
} from '@halfdomelabs/sync';

import { fastifyVitestGenerator } from '@src/generators/vitest/index.js';

import { configServiceGenerator } from '../config-service/config-service.generator.js';
import { errorHandlerServiceGenerator } from '../error-handler-service/error-handler-service.generator.js';
import { fastifyCookieContextGenerator } from '../fastify-cookie-context/fastify-cookie-context.generator.js';
import { fastifyGracefulShutdownGenerator } from '../fastify-graceful-shutdown/fastify-graceful-shutdown.generator.js';
import { fastifyHealthCheckGenerator } from '../fastify-health-check/fastify-health-check.generator.js';
import { fastifyScriptsGenerator } from '../fastify-scripts/fastify-scripts.generator.js';
import { fastifyServerGenerator } from '../fastify-server/fastify-server.generator.js';
import { fastifyGenerator } from '../fastify/fastify.generator.js';
import { loggerServiceGenerator } from '../logger-service/logger-service.generator.js';
import { requestContextGenerator } from '../request-context/request-context.generator.js';
import { requestServiceContextGenerator } from '../request-service-context/request-service-context.generator.js';
import { rootModuleGenerator } from '../root-module/root-module.generator.js';
import { serviceContextGenerator } from '../service-context/service-context.generator.js';

export function composeFastifyApplication(
  root: InferDescriptorFromGenerator<typeof fastifyGenerator>,
): GeneratorBundle {
  return fastifyGenerator({
    ...root,
    children: {
      logger: loggerServiceGenerator({}),
      rootModule: rootModuleGenerator({}),
      errorHandler: errorHandlerServiceGenerator({}),
      config: configServiceGenerator({}),
      fastifyServer: fastifyServerGenerator({}),
      healthCheck: fastifyHealthCheckGenerator({}),
      requestContext: requestContextGenerator({}),
      fastifyGracefulShutdown: fastifyGracefulShutdownGenerator({}),
      fastifyVitest: fastifyVitestGenerator({}),
      serviceContext: serviceContextGenerator({}),
      requestServiceContext: requestServiceContextGenerator({}),
      fastifyCookieContext: fastifyCookieContextGenerator({}),
      fastifyScripts: fastifyScriptsGenerator({}),
      ...root.children,
    },
  });
}
