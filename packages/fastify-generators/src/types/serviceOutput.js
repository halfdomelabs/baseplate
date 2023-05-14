"use strict";
// standard typings of service output
exports.__esModule = true;
exports.prismaToServiceOutputDto = exports.nestedPrismaFieldToServiceField = exports.scalarPrismaFieldToServiceField = void 0;
function scalarPrismaFieldToServiceField(field, lookupEnum) {
    if (field.scalarType === 'enum' && !field.enumType) {
        throw new Error("Enum field must have enum type.");
    }
    return {
        type: 'scalar',
        name: field.name,
        isOptional: field.isOptional,
        isNullable: field.isOptional,
        isList: field.isList,
        scalarType: field.scalarType,
        enumType: field.enumType === undefined ? undefined : lookupEnum(field.enumType),
        isId: field.id
    };
}
exports.scalarPrismaFieldToServiceField = scalarPrismaFieldToServiceField;
function nestedPrismaFieldToServiceField(field) {
    return {
        type: 'nested',
        name: field.name,
        isOptional: field.isOptional,
        isNullable: field.isOptional,
        isList: field.isList,
        isPrismaType: true,
        nestedType: {
            name: field.modelType
        }
    };
}
exports.nestedPrismaFieldToServiceField = nestedPrismaFieldToServiceField;
function prismaToServiceOutputDto(model, lookupEnum) {
    return {
        name: model.name,
        fields: model.fields.map(function (field) {
            return field.type === 'scalar'
                ? scalarPrismaFieldToServiceField(field, lookupEnum)
                : nestedPrismaFieldToServiceField(field);
        })
    };
}
exports.prismaToServiceOutputDto = prismaToServiceOutputDto;
