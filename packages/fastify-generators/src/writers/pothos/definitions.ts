import type {
  TsCodeFragment,
  TsCodeFragmentWithDependencies,
} from '@halfdomelabs/core-generators';

/**
 * Defines a Pothos type with a name and a fragment.
 */
export type PothosTypeDefinition = TsCodeFragmentWithDependencies;

/**
 * A Pothos type definition that declares the a variable with the type.
 */
export interface PothosTypeDefinitionWithVariableName
  extends PothosTypeDefinition {
  /**
   * The name of the variable name of the type exported by the definition.
   */
  variableName: string;
}

/**
 * A TS code fragment that has a list of dependencies with Pothos type definitions.
 */
export interface PothosCodeFragment {
  /**
   * The fragment of the code.
   */
  fragment: TsCodeFragment;
  /**
   * The dependencies of the fragment.
   */
  dependencies?: PothosTypeDefinition[];
}
