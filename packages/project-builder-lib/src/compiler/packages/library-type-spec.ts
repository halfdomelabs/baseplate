import z from 'zod';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { RefContextSlot } from '#src/references/ref-context-slot.js';
import type {
  BasePackageConfig,
  DefinitionSchemaParserContext,
  libraryEntityType,
} from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/index.js';
import { basePackageValidators } from '#src/schema/packages/base.js';

import type { PackageCompiler } from './package-compiler-types.js';

/**
 * Schema creator for package types that requires packageSlot.
 */
export type LibraryDefinitionCreator = (
  ctx: DefinitionSchemaParserContext,
  slots: { librarySlot: RefContextSlot<typeof libraryEntityType> },
) => z.ZodType;

export interface LibraryDefinitionSchemaEntry {
  name: string;
  schemaCreator: LibraryDefinitionCreator;
}

const nodeLibraryDefinitionSchemaCreator: LibraryDefinitionCreator = () =>
  z.object({
    ...basePackageValidators,
    type: z.literal('node-library'),
  });

export const nodeLibraryDefinitionSchemaEntry: LibraryDefinitionSchemaEntry = {
  name: 'node-library',
  schemaCreator: nodeLibraryDefinitionSchemaCreator,
};

export interface LibraryCompilerCreator<
  T extends BasePackageConfig = BasePackageConfig,
> {
  name: string;
  createCompiler: (
    definitionContainer: ProjectDefinitionContainer,
    packageConfig: T,
  ) => PackageCompiler;
}

/**
 * Package type spec for registering package schemas and compilers.
 */
export const libraryTypeSpec = createFieldMapSpec('core/library-type', (t) => ({
  schemaCreators: t.namedArrayToMap<LibraryDefinitionSchemaEntry>([
    nodeLibraryDefinitionSchemaEntry,
  ]),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compilerCreators: t.namedArrayToMap<LibraryCompilerCreator<any>>(),
}));
