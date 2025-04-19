import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsHoistedFragment,
  tsImportBuilder,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { fastifyServerConfigProvider } from '../fastify-server/fastify-server.generator.js';
import { requestServiceContextConfigProvider } from '../request-service-context/request-service-context.generator.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export const fastifyCookieContextGenerator = createGenerator({
  name: 'core/fastify-cookie-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['@fastify/cookie']),
    }),
    fastifyServer: createProviderTask(
      fastifyServerConfigProvider,
      (fastifyServerConfig) => {
        fastifyServerConfig.plugins.set('cookies', {
          plugin: tsCodeFragment(
            'fastifyCookie',
            tsImportBuilder().default('fastifyCookie').from('@fastify/cookie'),
          ),
        });
      },
    ),
    requestServiceContext: createProviderTask(
      requestServiceContextConfigProvider,
      (requestServiceContextConfig) => {
        requestServiceContextConfig.contextFields.set('cookieStore', {
          type: tsCodeFragment('CookieStore', undefined, {
            hoistedFragments: [
              tsHoistedFragment(
                tsCodeFragment(
                  `
interface CookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieSerializeOptions): void;
  clear(name: string): void;
                }`,
                  tsImportBuilder(['CookieSerializeOptions']).from(
                    '@fastify/cookie',
                  ),
                ),
                'cookie-store-interface',
              ),
            ],
          }),
          body: (req, reply) =>
            tsCodeFragment(
              `function getReply(): FastifyReply {
          if (!${reply}) {
            throw new Error(
              'Reply is not defined. This may happen if calling this function from a websocket connection.'
            );
          }
          return ${reply};
        }
      `,
            ),
          creator: (req) =>
            tsCodeFragment(
              `
{
  get: (name) => ${req}.cookies[name],
  set: (name, value, options) => void getReply().setCookie(name, value, options),
  clear: (name) => void getReply().clearCookie(name),
}
`,
            ),
        });
        return {};
      },
    ),
  }),
});
