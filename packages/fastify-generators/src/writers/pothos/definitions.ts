import type { TsCodeFragment } from '@halfdomelabs/core-generators';

/**
 * A Pothos type definition that declares the a variable with the type.
 */
export interface PothosTypeDefinitionWithVariableName {
  /**
   * The name of the variable name of the type exported by the definition.
   */
  variableName: string;

  /**
   * The name of the type.
   */
  name: string;

  /**
   * The fragment of the code.
   */
  fragment: TsCodeFragment;
}
