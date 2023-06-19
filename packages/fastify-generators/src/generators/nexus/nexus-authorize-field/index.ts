import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { nexusTypeProvider } from '@src/providers/nexus-type.js';
import { authorizeConfigSchema, nexusAuthProvider } from '../nexus-auth/index.js';

const descriptorSchema = authorizeConfigSchema;

const NexusAuthorizeFieldGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    nexusAuth: nexusAuthProvider,
    nexusType: nexusTypeProvider,
  },
  createGenerator(descriptor, { nexusAuth, nexusType }) {
    nexusType.addCustomField(
      'authorize',
      nexusAuth.formatAuthorizeConfig(descriptor)
    );
    return {
      build: async () => {},
    };
  },
});

export default NexusAuthorizeFieldGenerator;
