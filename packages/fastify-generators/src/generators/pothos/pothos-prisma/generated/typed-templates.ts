import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const pothosPrismaTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'pothos-prisma-types',
  projectExports: {
    getDatamodel: {},
    PrismaTypes: { isTypeOnly: true, exportedAs: 'default' },
  },
  projectExportsOnly: true,
  source: { contents: '' },
  variables: {},
});

export const POTHOS_POTHOS_PRISMA_TEMPLATES = { pothosPrismaTypes };
