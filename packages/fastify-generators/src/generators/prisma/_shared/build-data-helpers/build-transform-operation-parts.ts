import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';

import type { PrismaOutputModel } from '#src/types/prisma-output.js';

import type { DataUtilsImportsProvider } from '../../data-utils/index.js';
import type { InputFieldDefinitionOutput } from '../field-definition-generators/types.js';

import { generateRelationBuildData } from './generate-relation-build-data.js';

/**
 * Configuration for building transform operation parts.
 */
interface TransformOperationConfig {
  /** All fields for this operation (scalar + transform) */
  fields: InputFieldDefinitionOutput[];
  /** Prisma model for FK relation detection */
  prismaModel: PrismaOutputModel;
  /** Data utils imports for relation helpers */
  dataUtilsImports: DataUtilsImportsProvider;
  /** Create or update operation */
  operationType: 'create' | 'update';
  /** Variable name for the input (default: 'data') */
  inputVarName?: string;
  /** Fragment or string for the transformers variable (e.g., 'xTransformers' or an import fragment) */
  transformersVarFragment?: TsCodeFragment | string;
  /** Variable name for existing item in update operations (default: 'existingItem') */
  existingItemVarName?: string;
  /**
   * Variable name to use in loadExisting where clauses (default: 'where').
   * Set to existingItemVarName for nested processUpdate context where
   * loadExisting should reference the existing nested item.
   */
  loadExistingVarName?: string;
  /** Additional entries for the Prisma data object (e.g., parent connect for nested) */
  additionalDataEntries?: Record<string, TsCodeFragment | string>;
}

/**
 * Result of building transform operation parts.
 * Contains all the fragments needed to generate a create/update operation body.
 */
export interface TransformOperationParts {
  /** Names of transform fields */
  transformFieldNames: string[];
  /** Names of FK fields that need destructuring */
  foreignKeyFieldNames: string[];
  /** Whether destructuring is needed */
  hasDestructure: boolean;
  /** The destructure statement (e.g., `const { field1, ...rest } = input;`), or empty string */
  inputDestructureFragment: TsCodeFragment | string;
  /** The rest data variable name ('rest' or inputVarName) */
  dataName: string;
  /** Whether there are any sub-transform fields */
  hasTransformFields: boolean;
  /** The Prisma data fragment (object or just the variable name) */
  prismaDataFragment: TsCodeFragment | string;
  /** The transformer entries object for prepareTransformers (undefined if no transform fields) */
  transformersObjectFragment?: TsCodeFragment;
  /** Individual relation entries for create operations */
  createRelationEntries: Record<string, TsCodeFragment>;
  /** Individual relation entries for update operations */
  updateRelationEntries: Record<string, TsCodeFragment>;
}

/**
 * Builds the transformer entries object for `prepareTransformers()`.
 *
 * For create: `{ field: transformers.field.forCreate(field) }`
 * For update: `{ field: transformers.field.forUpdate(field, existingItem.fieldId) }`
 *
 * @param transformFields - Fields that need transformer handling
 * @param transformersVarFragment - Reference to the transformers variable
 * @param operationType - Create or update
 * @param existingItemVarName - Variable name for the existing item (for update)
 * @param loadExistingVarName - Variable name to use in loadExisting where clauses.
 *   Defaults to 'where'. Set to existingItemVarName for nested processUpdate context
 *   where loadExisting should reference the existing nested item, not the parent's where.
 * @returns TsCodeFragment for the transformers object
 */
export function buildTransformerEntries(
  transformFields: InputFieldDefinitionOutput[],
  transformersVarFragment: TsCodeFragment | string,
  operationType: 'create' | 'update',
  existingItemVarName = 'existingItem',
  loadExistingVarName = 'where',
): TsCodeFragment {
  if (operationType === 'create') {
    return TsCodeUtils.mergeFragmentsAsObject(
      Object.fromEntries(
        transformFields.map((field) => [
          field.name,
          tsTemplate`${transformersVarFragment}.${field.name}.forCreate(${field.name})`,
        ]),
      ),
    );
  }

  return TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(
      transformFields.map((field) => {
        const pattern = field.transformer?.forUpdatePattern;
        let forUpdateArg: TsCodeFragment | string;

        if (pattern?.kind === 'loadExisting') {
          // Rebuild the fragment if structured info is available and the context variable differs
          if (pattern.loadExistingInfo) {
            const { modelVar, findMethod, whereEntries } =
              pattern.loadExistingInfo;
            const whereClause = whereEntries
              .map(
                (e) => `${e.field}: ${loadExistingVarName}.${e.referenceField}`,
              )
              .join(', ');
            forUpdateArg = tsTemplate`{ loadExisting: () => prisma.${modelVar}.${findMethod}({ where: { ${whereClause} } }) }`;
          } else {
            forUpdateArg = tsTemplate`{ loadExisting: () => ${pattern.loadExistingFragment} }`;
          }
        } else if (pattern?.kind === 'existingField') {
          forUpdateArg = `${existingItemVarName}.${pattern.existingFieldName}`;
        } else {
          // Fallback: assume scalar field ID on existing item
          forUpdateArg = `${existingItemVarName}.${field.name}Id`;
        }

        return [
          field.name,
          tsTemplate`${transformersVarFragment}.${field.name}.forUpdate(${field.name}, ${forUpdateArg})`,
        ];
      }),
    ),
  );
}

/**
 * Builds a data expression that omits specified fields.
 * Returns `omit(dataExpr, ['field1', 'field2'])` as a TsCodeFragment.
 */
function buildOmitExpression(
  dataExpr: string,
  fieldsToOmit: string[],
): TsCodeFragment {
  const omitFrag = TsCodeUtils.importFragment('omit', 'es-toolkit');
  const fieldsList = fieldsToOmit.map((f) => `'${f}'`).join(', ');
  return tsTemplate`${omitFrag}(${dataExpr}, [${fieldsList}])`;
}

/**
 * Builds the Prisma data fragment for create/update operations.
 *
 * Merges: `{ ...dataName, ...transformed, relation: connect(...), ...additionalEntries }`
 *
 * When `fieldsToOmit` is provided, wraps the data spread with `omit()` from es-toolkit
 * to exclude ID fields that shouldn't be in Prisma update data.
 *
 * @param config - Configuration for building the data fragment
 * @returns TsCodeFragment or string for the Prisma data argument
 */
export function buildPrismaDataFragment(config: {
  dataName: string;
  hasTransformFields: boolean;
  relationEntries: Record<string, TsCodeFragment>;
  noRelations: boolean;
  additionalEntries?: Record<string, TsCodeFragment | string>;
  /** ID fields to omit from the data (for update operations) */
  fieldsToOmit?: string[];
}): TsCodeFragment | string {
  const {
    dataName,
    hasTransformFields,
    relationEntries,
    noRelations,
    additionalEntries,
    fieldsToOmit = [],
  } = config;

  const hasOmit = fieldsToOmit.length > 0;
  const hasAdditional =
    additionalEntries && Object.keys(additionalEntries).length > 0;

  // Simple case: just the data variable (possibly wrapped in omit)
  if (noRelations && !hasTransformFields && !hasAdditional) {
    return hasOmit ? buildOmitExpression(dataName, fieldsToOmit) : dataName;
  }

  // Build the spread expression for the data variable
  const dataSpreadExpr = hasOmit
    ? buildOmitExpression(dataName, fieldsToOmit)
    : dataName;
  const dataSpreadKey = hasOmit ? `...omit(${dataName})` : `...${dataName}`;

  const entries: Record<string, string | TsCodeFragment> = {
    [dataSpreadKey]: dataSpreadExpr,
  };
  if (hasTransformFields) {
    entries['...transformed'] = 'transformed';
  }
  for (const [name, fragment] of Object.entries(relationEntries)) {
    entries[name] = fragment;
  }
  if (additionalEntries) {
    for (const [name, fragment] of Object.entries(additionalEntries)) {
      entries[name] = fragment;
    }
  }

  return TsCodeUtils.mergeFragmentsAsObject(entries, { disableSort: true });
}

/**
 * Builds all the parts needed for a transform-aware create/update operation.
 *
 * This is the main shared helper used by:
 * - prisma-data-create generator (top-level create)
 * - prisma-data-update generator (top-level update)
 * - nested-field-writer (processCreate/processUpdate inside nested transformers)
 *
 * @param config - Configuration for the operation
 * @returns All fragments needed to generate the operation body
 */
export function buildTransformOperationParts(
  config: TransformOperationConfig,
): TransformOperationParts {
  const {
    fields,
    prismaModel,
    dataUtilsImports,
    operationType,
    inputVarName = 'data',
    transformersVarFragment,
    existingItemVarName = 'existingItem',
    loadExistingVarName = 'where',
    additionalDataEntries,
  } = config;

  // Split fields into scalar and transform
  const scalarFieldNames = fields
    .filter((f) => !f.isTransformField)
    .map((f) => f.name);
  const transformFieldDefs = fields.filter((f) => f.isTransformField);
  const transformFieldNames = transformFieldDefs.map((f) => f.name);

  // Generate FK → relation transformations
  const {
    passthrough: noFkRelations,
    foreignKeyFieldNames,
    createRelationEntries,
    updateRelationEntries,
  } = generateRelationBuildData({
    prismaModel,
    inputFieldNames: scalarFieldNames,
    dataUtilsImports,
    dataName: 'rest',
  });

  // For update operations, compute ID fields that need to be omitted from the data.
  // Prisma will crash if ID fields are included in update data.
  // These are model ID fields that are in the input but not already handled as FK or transform fields.
  const fieldsToOmit =
    operationType === 'update'
      ? (prismaModel.idFields ?? []).filter(
          (f) =>
            scalarFieldNames.includes(f) && !foreignKeyFieldNames.includes(f),
        )
      : [];

  // Build the destructure pattern (transform fields + FK fields only)
  const allDestructuredNames = [
    ...new Set([...transformFieldNames, ...foreignKeyFieldNames]),
  ];
  const hasDestructure = allDestructuredNames.length > 0;

  const inputDestructureFragment = hasDestructure
    ? tsTemplate`const { ${allDestructuredNames.join(', ')}, ...rest } = ${inputVarName};`
    : '';

  const dataName = hasDestructure ? 'rest' : inputVarName;

  // Build the Prisma data object
  const relationEntries =
    operationType === 'create' ? createRelationEntries : updateRelationEntries;
  const hasTransformFields = transformFieldDefs.length > 0;

  const prismaDataFragment = buildPrismaDataFragment({
    dataName,
    hasTransformFields,
    relationEntries,
    noRelations: noFkRelations,
    additionalEntries: additionalDataEntries,
    fieldsToOmit,
  });

  // Build transformer entries (if there are transform fields and a transformers var)
  let transformersObjectFragment: TsCodeFragment | undefined;
  if (hasTransformFields && transformersVarFragment) {
    transformersObjectFragment = buildTransformerEntries(
      transformFieldDefs,
      transformersVarFragment,
      operationType,
      existingItemVarName,
      loadExistingVarName,
    );
  }

  return {
    transformFieldNames,
    foreignKeyFieldNames,
    hasDestructure,
    inputDestructureFragment,
    dataName,
    hasTransformFields,
    prismaDataFragment,
    transformersObjectFragment,
    createRelationEntries,
    updateRelationEntries,
  };
}
