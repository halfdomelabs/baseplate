import type { MetafileDefinition } from '../config/types.js';

const GITIGNORE_CONTENT = `*.tsbuildinfo
.turbo
dist
node_modules
generated
vitest.config.*.timestamp-*
*.local
`;

const gitignoreMetafile: MetafileDefinition = {
  fileName: '.gitignore',
  shouldExist: () => true,
  getContent: () => GITIGNORE_CONTENT,
};

export default gitignoreMetafile;