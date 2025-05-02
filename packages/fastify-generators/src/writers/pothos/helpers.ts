import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsTemplate,
} from '@halfdomelabs/core-generators';
import { quot } from '@halfdomelabs/utils';

import type { ServiceOutputDtoScalarField } from '@src/types/service-output.js';

import type { PothosTypeReference, PothosWriterOptions } from './options.js';

interface PothosFieldOptions {
  required?: boolean;
  nullable?: boolean;
  type?: TsCodeFragment;
}

/**
 * Write the options for a Pothos field e.g.
 * ```ts
 * { type: 'String', required: true, nullable: true }
 * ```
 *
 * @returns A fragment containing the options for a Pothos field or `undefined` if there are no options.
 */
export function writePothosFieldOptions(
  fieldOptions: PothosFieldOptions,
): TsCodeFragment | undefined {
  const formattedFieldOptions = {
    required: fieldOptions.required ? 'true' : undefined,
    nullable: fieldOptions.nullable ? 'true' : undefined,
    type: fieldOptions.type,
  };

  const hasFieldOptions = Object.values(formattedFieldOptions).some(
    (a) => a !== undefined,
  );

  return hasFieldOptions
    ? TsCodeUtils.mergeFragmentsAsObject(formattedFieldOptions)
    : undefined;
}

/**
 * Gets the Pothos type as a fragment and wraps it in an array if the field is a list.
 *
 * @param fragment - The Pothos type to wrap.
 * @param isList - Whether the field is a list.
 * @returns A fragment containing the Pothos type wrapped in an array if the field is a list.
 */
export function getPothosTypeAsFragment(
  fragmentOrReference: TsCodeFragment | PothosTypeReference,
  isList?: boolean,
): TsCodeFragment {
  const fragment =
    'fragment' in fragmentOrReference
      ? fragmentOrReference.fragment
      : fragmentOrReference;
  return isList ? tsTemplate`[${fragment}]` : fragment;
}

/**
 * Get the Pothos method and type for a scalar field.
 *
 * The type will be returned for enum types and the pothos method will be returned for scalar types
 * that have a specific method e.g. `t.uuid()`.
 *
 * @param field - The field to get the Pothos method and type for.
 * @param options - The options for the Pothos writer.
 * @returns The Pothos method and type for the scalar field if present.
 */
export function getPothosMethodAndTypeForScalar(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions,
): {
  methodName?: string | undefined;
  type?: TsCodeFragment | undefined;
} {
  const { pothosMethod, name: scalarName } =
    options.pothosSchemaBaseTypes.scalarConfig(field.scalarType);

  // prefer use of .id instead of .uuid for IDs
  const pothosMethodWithId =
    field.isId && (field.scalarType === 'uuid' || field.scalarType === 'string')
      ? 'id'
      : pothosMethod;

  // ex: t.field('enum', { type: MyCoolEnum })
  if (field.scalarType === 'enum') {
    if (!field.enumType) {
      throw new Error(`All enum types must have enumType specified!`);
    }
    return {
      type: getPothosTypeAsFragment(
        options.pothosSchemaBaseTypes.enumRefOrThrow(field.enumType.name),
        field.isList,
      ),
    };
  }

  // ex: t.id()
  if (pothosMethodWithId) {
    const pothosMethodWithList = `${pothosMethodWithId}${
      field.isList ? 'List' : ''
    }`;
    return {
      methodName: pothosMethodWithList,
    };
  }

  // ex: t.field({type: "Uuid"});
  const quotedScalarName = quot(scalarName);
  return {
    type: tsCodeFragment(
      field.isList ? `[${quotedScalarName}]` : quotedScalarName,
    ),
  };
}
