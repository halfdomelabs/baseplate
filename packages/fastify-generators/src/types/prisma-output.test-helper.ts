import type {
  PrismaOutputRelationField,
  PrismaOutputScalarField,
} from './prisma-output.js';

// Helper to create a scalar field
export const createMockScalarField = (
  name: string,
): PrismaOutputScalarField => ({
  name,
  type: 'scalar',
  id: false,
  isOptional: false,
  isList: false,
  hasDefault: false,
  order: 0,
  scalarType: 'string',
});

// Helper to create a relation field
export const createMockRelationField = (
  name: string,
  fields: string[],
  references: string[],
  isOptional = false,
): PrismaOutputRelationField => ({
  name,
  type: 'relation',
  id: false,
  isOptional,
  isList: false,
  hasDefault: false,
  modelType: 'Related',
  fields,
  references,
});
