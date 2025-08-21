import type {
  DefinitionEntityInput,
  DefinitionReferenceInput,
} from './definition-ref-builder.js';
import type { DefinitionEntityType } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- to allow it to accept any generic
type AnyDefinitionReferenceInput = DefinitionReferenceInput<any, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- to allow it to accept any generic
export type AnyDefinitionEntityInput = DefinitionEntityInput<any, any>;

export class DefinitionReferenceMarker {
  public value: string | undefined;
  public reference: AnyDefinitionReferenceInput;

  constructor(
    value: string | undefined,
    reference: AnyDefinitionReferenceInput,
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
  entities: AnyDefinitionEntityInput[];
  references: AnyDefinitionReferenceInput[];
  contextPaths: { path: string; type: DefinitionEntityType; context: string }[];
}
