import { TsCodeUtils } from '@baseplate-dev/core-generators';
import {
  appRuntimeConfigProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

export const placeholderAuthModuleGenerator = createGenerator({
  name: 'placeholder-auth/core/placeholder-auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        userSessionTypesImports: userSessionTypesImportsProvider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ appRuntimeConfig, userSessionTypesImports, paths }) {
        appRuntimeConfig.services.set(
          'userSession',
          userSessionTypesImports.UserSessionService.typeFragment(),
        );
        appRuntimeConfig.construction.set('userSession', {
          fragment: TsCodeUtils.template`
            const userSession = ${TsCodeUtils.importFragment('createPlaceholderUserSessionService', paths.userSessionService)}();
          `,
        });
      },
    }),
    authService: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ renderers }) {
        return {
          async build(builder) {
            await builder.apply(renderers.userSessionService.render({}));
          },
        };
      },
    }),
  }),
});
