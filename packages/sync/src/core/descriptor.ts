import * as yup from 'yup';

export interface BaseGeneratorDescriptor {
  name?: string;
  generator: string;
  peerProvider?: boolean;
  hoistedProviders?: string[];
}

export const baseDescriptorSchema = {
  name: yup.string(),
  generator: yup.string().required(),
  peerProvider: yup.boolean(),
  hoistedProviders: yup.array(yup.string().required()),
};
