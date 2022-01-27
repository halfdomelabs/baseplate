import { fs } from 'memfs';

// monkey-patch fs.realpath.native because of https://github.com/streamich/memfs/issues/803

(fs.realpath as unknown as { native: () => unknown }).native = () => {
  throw new Error('Not implemented');
};

export = fs;
