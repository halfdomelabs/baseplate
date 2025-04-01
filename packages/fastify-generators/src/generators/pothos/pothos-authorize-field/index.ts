import type { z } from 'zod';

import { createGenerator } from '@halfdomelabs/sync';

import { pothosFieldProvider } from '@src/providers/pothos-field.js';

import {
  pothosAuthorizeConfigSchema,
  pothosAuthProvider,
} from '../pothos-auth/index.js';

const descriptorSchema = pothosAuthorizeConfigSchema;

export const pothosAuthorizeFieldGenerator = createGenerator({
  name: 'pothos/pothos-authorize-field',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask({
      name: 'main',
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
    });
  },
});
