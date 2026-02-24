import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { tsTemplate } from '@baseplate-dev/core-generators';
import { quot } from '@baseplate-dev/utils';

import type { ServiceOutputDtoScalarField } from '#src/types/service-output.js';

import { upperCaseFirst } from '#src/utils/case.js';

import type { PothosWriterOptions } from './options.js';

import {
  getPothosMethodAndTypeForScalar,
  writePothosFieldOptions,
} from './helpers.js';

/**
 * Write a Pothos input field from a scalar field, e.g.
 * ```ts
 * t.field({ type: 'String' });
 * ```
 *
 * @param field - The field to write the Pothos input field for.
 * @param options - The options for the Pothos writer.
 * @returns The Pothos input field.
 */
export function writePothosInputFieldFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions,
): TsCodeFragment {
  const { methodName = 'field', type } = getPothosMethodAndTypeForScalar(
    field,
    options,
  );

  const fieldOptions = writePothosFieldOptions({
    required: !field.isOptional,
    type,
  });

  return tsTemplate`${options.fieldBuilder}.${methodName}(${fieldOptions ?? ''})`;
}

/**
 * Write a Pothos object field from a scalar field, e.g.
 * ```ts
 * t.field({ type: 'String' });
 * ```
 *
 * @param field - The field to write the Pothos object field for.
 * @param options - The options for the Pothos writer.
 * @returns The Pothos object field.
 */
export function writePothosObjectFieldFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions,
): TsCodeFragment {
  const { methodName = 'field', type } = getPothosMethodAndTypeForScalar(
    field,
    options,
  );
  const fieldOptions = writePothosFieldOptions({
    nullable: field.isOptional,
    type,
  });

  return tsTemplate`${options.fieldBuilder}.${methodName}(${fieldOptions ?? ''})`;
}

/**
 * Write a Pothos expose field from a scalar field, e.g.
 * ```ts
 * t.exposeId();
 * ```
 *
 * @param field - The field to write the Pothos expose field for.
 * @param options - The options for the Pothos writer.
 * @returns The Pothos expose field.
 */
export function writePothosExposeFieldFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: PothosWriterOptions & { authorize?: TsCodeFragment },
): TsCodeFragment {
  const { methodName, type } = getPothosMethodAndTypeForScalar(field, options);
  const fieldOptions = writePothosFieldOptions({
    nullable: field.isOptional,
    type,
    authorize: options.authorize,
  });

  const exposeMethodName = (() => {
    // exposeID instead of exposeId
    if (methodName === 'id') return 'exposeID';
    if (methodName === 'idList') return 'exposeIDList';
    // If the method name is an inbuilt Pothos method, use the method name directly
    if (methodName) return `expose${upperCaseFirst(methodName)}`;
    return 'expose';
  })();

  return tsTemplate`${options.fieldBuilder}.${exposeMethodName}(${quot(field.name)}, ${fieldOptions ?? ''})`;
}
