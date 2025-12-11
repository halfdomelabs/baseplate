import type { DefinitionEntityNameResolver } from './definition-ref-builder.js';
import type { RefContextSlot } from './ref-context-slot.js';
import type {
  DefinitionEntityType,
  ReferenceOnDeleteAction,
  ReferencePath,
} from './types.js';

export interface DefinitionEntityAnnotation {
  path: ReferencePath;
  id: string;
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

export const REF_ANNOTATIONS_MARKER_SYMBOL = Symbol('refAnnotationsMarker');

export interface DefinitionRefAnnotations {
  entities: DefinitionEntityAnnotation[];
  references: DefinitionReferenceAnnotation[];
  slots: DefinitionSlotAnnotation[];
}
