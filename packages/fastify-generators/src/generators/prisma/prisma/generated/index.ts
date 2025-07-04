import { PRISMA_PRISMA_PATHS } from './template-paths.js';
import { PRISMA_PRISMA_RENDERERS } from './template-renderers.js';
import { PRISMA_PRISMA_IMPORTS } from './ts-import-providers.js';
import { PRISMA_PRISMA_TEMPLATES } from './typed-templates.js';

export const PRISMA_PRISMA_GENERATED = {
  imports: PRISMA_PRISMA_IMPORTS,
  paths: PRISMA_PRISMA_PATHS,
  renderers: PRISMA_PRISMA_RENDERERS,
  templates: PRISMA_PRISMA_TEMPLATES,
};
