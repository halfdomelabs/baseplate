import type { z } from 'zod';

import { createGenerator, createTaskConfigBuilder } from '@halfdomelabs/sync';

import { pothosFieldProvider } from '@src/providers/pothos-field.js';

import {
  pothosAuthorizeConfigSchema,
  pothosAuthProvider,
} from '../pothos-auth/index.js';

const descriptorSchema = pothosAuthorizeConfigSchema;

type Descriptor = z.infer<typeof descriptorSchema>;

const createMainTask = createTaskConfigBuilder((descriptor: Descriptor) => ({
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
}));

export const pothosAuthorizeFieldGenerator = createGenerator({
  name: 'pothos/pothos-authorize-field',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});
