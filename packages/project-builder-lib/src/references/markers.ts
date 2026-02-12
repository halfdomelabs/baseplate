import type { DefinitionEntityNameResolver } from './definition-ref-builder.js';
import type {
  ExpressionSlotMap,
  RefExpressionParser,
} from './expression-types.js';
import type { RefContextSlot } from './ref-context-slot.js';
import type {
  DefinitionEntityType,
  ReferenceOnDeleteAction,
  ReferencePath,
} from './types.js';

export interface DefinitionEntityAnnotation {
  path: ReferencePath;
  id: string;
  idPath: ReferencePath;
  type: DefinitionEntityType;
  nameResolver: DefinitionEntityNameResolver | string;
  parentSlot?: RefContextSlot;
  provides?: RefContextSlot;
}

export interface DefinitionReferenceAnnotation {
  path: ReferencePath;
  type: DefinitionEntityType;
  onDelete: ReferenceOnDeleteAction;
  parentSlot?: RefContextSlot;
  provides?: RefContextSlot;
}

export interface DefinitionSlotAnnotation {
  path: ReferencePath;
  slot: RefContextSlot;
}

/**
 * Annotation for an expression in a definition.
 * Contains the path, value, parser, and optional slots for context-dependent expressions.
 */
export interface DefinitionExpressionAnnotation {
  path: ReferencePath;
  /** The raw expression value */
  value: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parser: RefExpressionParser<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slots?: ExpressionSlotMap<any>;
}

export class DefinitionReferenceMarker {
  public value: string | undefined;
  public reference: DefinitionReferenceAnnotation;

  constructor(
    value: string | undefined,
    reference: DefinitionReferenceAnnotation,
  ) {
    this.value = value;
    this.reference = reference;
  }

  toString(): string {
    return this.value ?? '';
  }
}

/**
 * Marker class for expressions during schema parsing.
 * Similar to `DefinitionReferenceMarker`, this wraps expression values
 * during the Zod parsing phase when `transformReferences` is enabled.
 */
export class DefinitionExpressionMarker {
  public value: unknown;
  public expression: DefinitionExpressionAnnotation;

  constructor(value: unknown, expression: DefinitionExpressionAnnotation) {
    this.value = value;
    this.expression = expression;
  }

  toString(): string {
    return String(this.value);
  }
}

export const REF_ANNOTATIONS_MARKER_SYMBOL = Symbol('refAnnotationsMarker');

export interface DefinitionRefAnnotations {
  entities: DefinitionEntityAnnotation[];
  references: DefinitionReferenceAnnotation[];
  slots: DefinitionSlotAnnotation[];
}
