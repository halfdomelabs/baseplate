import { Descriptor, Module, Action } from '@sync/types';
import { promises as filesystem } from 'fs';
import * as yup from 'yup';
import path from 'path';

/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface Options {
  volume: any;
}

const baseDescriptorSchema = {
  name: yup.string().required(),
  module: yup.string().required(),
};

export class SyncService {
  modules: Record<string, Module<any>>;

  fs: typeof filesystem;

  constructor(modules: Record<string, Module<any>>, options?: Options) {
    this.modules = modules;
    this.fs = options?.volume || filesystem;
  }

  async loadProject(directory: string): Promise<Descriptor> {
    const projectPath = path.join(directory, 'baseplate/project.json');
    return this.loadDescriptor(projectPath);
  }

  private async loadDescriptor(file: string): Promise<Descriptor> {
    const { fs } = this;
    const data = JSON.parse(await fs.readFile(file, 'utf8'));
    if (!data) {
      throw new Error(`Descriptor in ${file} is invalid!`);
    }

    const mod = data.module && this.modules[data.module];
    if (!mod) {
      throw new Error(
        `Descriptor in ${file} has an invalid module "${data.module}"!`
      );
    }

    // validate descriptor
    const validatedDescriptor = await yup
      .object({
        ...baseDescriptorSchema,
        ...mod.descriptorSchema,
      })
      .validate(data);

    return mod.parseDescriptor
      ? mod.parseDescriptor(validatedDescriptor)
      : validatedDescriptor;
  }

  build(descriptor: Descriptor): Action[] {
    const mod = this.modules[descriptor.module];
    if (!mod) {
      throw new Error(`Could not find module to build "${descriptor.module}"`);
    }
    return mod.build ? mod.build(descriptor, '/') : [];
  }
}
