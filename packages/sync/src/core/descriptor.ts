import * as yup from 'yup';

export interface GeneratorDescriptor {
  generator: string;
  children?: { [key: string]: GeneratorDescriptor | GeneratorDescriptor[] };
}

export const baseDescriptorSchema = {
  generator: yup.string().required(),
  children: yup.mixed(),
};
