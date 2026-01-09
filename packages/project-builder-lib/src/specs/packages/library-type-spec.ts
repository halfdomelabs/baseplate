import type React from 'react';

import z from 'zod';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type {
  BaseLibraryDefinition,
  DefinitionSchemaCreatorWithSlots,
} from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/index.js';
import {
  definitionSchemaWithSlots,
  libraryEntityType,
} from '#src/schema/index.js';
import { baseLibraryValidators } from '#src/schema/libraries/base.js';

import type { PackageCompiler } from './package-compiler-types.js';

export interface LibraryDefinitionSchemaEntry<
  T extends BaseLibraryDefinition = BaseLibraryDefinition,
> {
  name: string;
  definitionSchema: DefinitionSchemaCreatorWithSlots<
    z.ZodType<T>,
    { librarySlot: typeof libraryEntityType }
  >;
}

const createNodeLibrarySchema = definitionSchemaWithSlots(
  { librarySlot: libraryEntityType },
  () =>
    z.object({
      ...baseLibraryValidators,
      type: z.literal('node-library'),
    }),
);

export const nodeLibraryDefinitionSchemaEntry = {
  name: 'node-library',
  definitionSchema: createNodeLibrarySchema,
};

export interface LibraryCompilerCreator<
  T extends BaseLibraryDefinition = BaseLibraryDefinition,
> {
  name: string;
  createCompiler: (
    definitionContainer: ProjectDefinitionContainer,
    packageConfig: T,
  ) => PackageCompiler;
}

/**
 * Props passed to library edit components
 */
export interface LibraryEditComponentProps<
  T extends BaseLibraryDefinition = BaseLibraryDefinition,
> {
  packageDefinition: T;
}

/**
 * Web configuration for a library type
 */
export interface LibraryWebConfig<
  T extends BaseLibraryDefinition = BaseLibraryDefinition,
> {
  name: string;
  /** React component for editing this library type */
  EditComponent: React.ComponentType<LibraryEditComponentProps<T>>;
}

/**
 * Package type spec for registering package schemas, compilers, and web configs.
 */
export const libraryTypeSpec = createFieldMapSpec('core/library-type', (t) => ({
  schemaCreators: t.namedArrayToMap<LibraryDefinitionSchemaEntry>([
    nodeLibraryDefinitionSchemaEntry,
  ]),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compilerCreators: t.namedArrayToMap<LibraryCompilerCreator<any>>(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webConfigs: t.namedArrayToMap<LibraryWebConfig<any>>(),
}));
