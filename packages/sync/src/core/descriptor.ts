import * as yup from 'yup';

export interface GeneratorDescriptor {
  key?: string;
  name?: string;
  generator: string;
  peerProvider?: boolean;
  children?: { [key: string]: GeneratorDescriptor | GeneratorDescriptor[] };
}

export const baseDescriptorSchema = {
  key: yup.string(),
  name: yup.string(),
  generator: yup.string().required(),
  peerProvider: yup.bool(),
  children: yup.mixed(),
};
