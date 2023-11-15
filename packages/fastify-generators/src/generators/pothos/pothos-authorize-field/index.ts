import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import {
  pothosAuthorizeConfigSchema,
  pothosAuthProvider,
} from '../pothos-auth/index.js';
import { pothosFieldProvider } from '@src/providers/pothos-field.js';

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

const PothosAuthorizeFieldGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default PothosAuthorizeFieldGenerator;
