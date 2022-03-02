import { ScalarFieldType } from '@src/types/fieldTypes';
import {
  ServiceOutputDtoField,
  ServiceOutputDtoScalarField,
} from '@src/types/serviceOutput';
import { NexusScalarConfig } from './scalars';

interface NexusDefinitionWriterOptions {
  builder: string;
  lookupScalar: (name: ScalarFieldType) => NexusScalarConfig;
}

function writeNexusDefinitionFromDtoScalarField(
  field: ServiceOutputDtoScalarField,
  options: NexusDefinitionWriterOptions
): string {
  const components = [options.builder];

  if (field.isOptional) {
    components.push('.nonNull');
  }

  if (field.isList) {
    components.push('.list.nonNull');
  }

  components.push(
    `.${options.lookupScalar(field.scalarType).nexusMethod}("${field.name}")`
  );

  return components.join('');
}

export function writeNexusDefinitionFromDtoFields(
  fields: ServiceOutputDtoField[],
  options: NexusDefinitionWriterOptions
): string {
  return fields
    .filter(
      (field): field is ServiceOutputDtoScalarField => field.type === 'scalar'
    )
    .map((field) => writeNexusDefinitionFromDtoScalarField(field, options))
    .join('\n');
}
