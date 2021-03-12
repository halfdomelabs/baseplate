export interface FieldType {
  name: string;
  jsType: string;
  nexusType: string;
}

export const FIELD_TYPES: FieldType[] = [
  { name: 'increments', jsType: 'number', nexusType: 'int' },
  { name: 'boolean', jsType: 'boolean', nexusType: 'boolean' },
  { name: 'integer', jsType: 'number', nexusType: 'int' },
  { name: 'dateTime', jsType: 'string', nexusType: 'string' },
  { name: 'string', jsType: 'string', nexusType: 'string' },
];
