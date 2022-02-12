import * as yup from 'yup';

export interface BaseGeneratorDescriptor {
  name?: string;
  generator: string;
  peerProvider?: boolean;
}

export const baseDescriptorSchema = {
  name: yup.string(),
  generator: yup.string().required(),
  peerProvider: yup.boolean(),
};
