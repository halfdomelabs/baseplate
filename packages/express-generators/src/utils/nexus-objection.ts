import { TypescriptCodeBlock } from '@baseplate/core-generators';
import { ObjectionFieldProvider } from '../generators/objection-field';

export function fieldToDefinition(
  field: ObjectionFieldProvider
): TypescriptCodeBlock {
  const nonNull = field.isRequired() ? '.nonNull' : '';
  const type = field.isIdField() ? 'id' : field.getType().nexusType;
  return {
    code: `t${nonNull}.${type}('${field.getName()}')`,
  };
}
