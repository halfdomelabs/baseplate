import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsHoistedFragment,
  tsImportBuilder,
  tsTypeImportBuilder,
} from '@baseplate-dev/core-generators';
import { createGenerator, createProviderTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import { fastifyServerConfigProvider } from '../fastify-server/index.js';
import { requestServiceContextConfigProvider } from '../request-service-context/index.js';

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
                'cookie-store-interface',
                `
interface CookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieSerializeOptions): void;
  clear(name: string, options?: CookieSerializeOptions): void;
                }`,
                tsTypeImportBuilder(['CookieSerializeOptions']).from(
                  '@fastify/cookie',
                ),
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
  clear: (name, options) => void getReply().clearCookie(name, options),
}
`,
            ),
        });
        return {};
      },
    ),
  }),
});
