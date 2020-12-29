import * as yup from 'yup';

export interface GeneratorDescriptor {
  name?: string;
  generator: string;
  peerProvider?: boolean;
  children?: { [key: string]: GeneratorDescriptor | GeneratorDescriptor[] };
}

export const baseDescriptorSchema = {
  name: yup.string(),
  generator: yup.string().required(),
  peerProvider: yup.bool(),
  children: yup.mixed(),
};
