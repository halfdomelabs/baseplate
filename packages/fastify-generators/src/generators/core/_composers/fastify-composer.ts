import type {
  GeneratorBundle,
  InferDescriptorFromGenerator,
} from '@halfdomelabs/sync';

import { fastifyVitestGenerator } from '@src/generators/vitest/index.js';

import { configServiceGenerator } from '../config-service/config-service.generator.js';
import { errorHandlerServiceGenerator } from '../error-handler-service/index.js';
import { fastifyCookieContextGenerator } from '../fastify-cookie-context/index.js';
import { fastifyGracefulShutdownGenerator } from '../fastify-graceful-shutdown/index.js';
import { fastifyHealthCheckGenerator } from '../fastify-health-check/index.js';
import { fastifyScriptsGenerator } from '../fastify-scripts/index.js';
import { fastifyServerGenerator } from '../fastify-server/index.js';
import { fastifyGenerator } from '../fastify/index.js';
import { loggerServiceGenerator } from '../logger-service/logger-service.generator.js';
import { requestContextGenerator } from '../request-context/index.js';
import { requestServiceContextGenerator } from '../request-service-context/index.js';
import { rootModuleGenerator } from '../root-module/index.js';
import { serviceContextGenerator } from '../service-context/index.js';

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
