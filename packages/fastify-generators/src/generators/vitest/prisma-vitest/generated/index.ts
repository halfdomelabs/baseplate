import { VITEST_PRISMA_VITEST_PATHS } from './template-paths.js';
import { VITEST_PRISMA_VITEST_RENDERERS } from './template-renderers.js';
import { VITEST_PRISMA_VITEST_IMPORTS } from './ts-import-providers.js';
import { VITEST_PRISMA_VITEST_TEMPLATES } from './typed-templates.js';

export const VITEST_PRISMA_VITEST_GENERATED = {
  imports: VITEST_PRISMA_VITEST_IMPORTS,
  paths: VITEST_PRISMA_VITEST_PATHS,
  renderers: VITEST_PRISMA_VITEST_RENDERERS,
  templates: VITEST_PRISMA_VITEST_TEMPLATES,
};
