import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { z } from 'zod';
import { pothosTypeProvider } from '@src/providers/pothos-type';
import {
  pothosAuthorizeConfigSchema,
  pothosAuthProvider,
} from '../pothos-auth';

const descriptorSchema = pothosAuthorizeConfigSchema;

type Descriptor = z.infer<typeof descriptorSchema>;

const createMainTask = createTaskConfigBuilder((descriptor: Descriptor) => ({
  name: 'main',
  dependencies: {
    pothosAuth: pothosAuthProvider,
    pothosType: pothosTypeProvider,
  },
  run({ pothosAuth, pothosType }) {
    pothosType.addCustomField({
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
