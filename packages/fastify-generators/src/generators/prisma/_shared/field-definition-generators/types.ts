import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import type { ServiceOutputDtoField } from '#src/types/service-output.js';

export interface InputFieldDefinitionOutput {
  name: string;
  fragment: TsCodeFragment;
  outputDtoField: ServiceOutputDtoField;
}
