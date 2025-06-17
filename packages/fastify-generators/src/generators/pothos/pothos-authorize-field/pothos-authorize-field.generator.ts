import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';

import { pothosFieldProvider } from '#src/generators/pothos/_providers/pothos-field.js';

import {
  pothosAuthorizeConfigSchema,
  pothosAuthProvider,
} from '../pothos-auth/index.js';

const descriptorSchema = pothosAuthorizeConfigSchema;

export const pothosAuthorizeFieldGenerator = createGenerator({
  name: 'pothos/pothos-authorize-field',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        pothosAuth: pothosAuthProvider,
        pothosType: pothosFieldProvider,
      },
      run({ pothosAuth, pothosType }) {
        pothosType.addCustomOption({
          name: 'authorize',
          value: pothosAuth.formatAuthorizeConfig(descriptor),
        });
        return {};
      },
    }),
  }),
});
