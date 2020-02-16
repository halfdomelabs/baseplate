import { Descriptor, Action } from '@sync/types';

export const SyncService = {
  loadDescriptor: (directory: string): Descriptor => {
    return {
      module: '',
      name: '',
    };
  },
  build: (descriptor: Descriptor): Action[] => {
    return [];
  },
};
