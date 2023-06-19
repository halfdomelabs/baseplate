import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
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
    return {
      build: async () => {},
    };
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
