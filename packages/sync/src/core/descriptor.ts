import * as yup from 'yup';

export type ChildDescriptorsOrReferences =
  | GeneratorDescriptor
  | string
  | (GeneratorDescriptor | string)[];

export interface GeneratorDescriptor {
  name?: string;
  generator: string;
  children?: {
    [key: string]: ChildDescriptorsOrReferences;
  };
}

export const baseDescriptorSchema = {
  name: yup.string(),
  generator: yup.string().required(),
  children: yup.mixed(),
};
