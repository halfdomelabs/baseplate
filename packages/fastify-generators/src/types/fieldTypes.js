"use strict";
exports.__esModule = true;
exports.getScalarFieldTypeInfo = exports.SCALAR_FIELD_TYPES = void 0;
exports.SCALAR_FIELD_TYPES = [
    'string',
    'int',
    'float',
    'decimal',
    'boolean',
    'json',
    'uuid',
    'dateTime',
    'date',
    'enum',
];
var scalarFieldTypeInfoMap = {
    string: { typescriptType: 'string' },
    int: { typescriptType: 'number' },
    float: { typescriptType: 'number' },
    decimal: { typescriptType: 'number' },
    boolean: { typescriptType: 'boolean' },
    json: { typescriptType: 'unknown' },
    uuid: { typescriptType: 'string' },
    dateTime: { typescriptType: 'Date' },
    date: { typescriptType: 'Date' },
    "enum": { typescriptType: 'string' }
};
function getScalarFieldTypeInfo(scalarFieldType) {
    if (scalarFieldType === 'enum') {
        throw new Error("Enum scalar type is not supported");
    }
    return scalarFieldTypeInfoMap[scalarFieldType];
}
exports.getScalarFieldTypeInfo = getScalarFieldTypeInfo;
