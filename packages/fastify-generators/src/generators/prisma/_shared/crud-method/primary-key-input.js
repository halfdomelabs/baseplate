"use strict";
exports.__esModule = true;
exports.getPrimaryKeyExpressions = exports.getPrimaryKeyDefinition = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var fieldTypes_1 = require("@src/types/fieldTypes");
function getPrimaryKeyDefinition(model) {
    var idFields = model.idFields, fields = model.fields;
    if (!(idFields === null || idFields === void 0 ? void 0 : idFields.length)) {
        throw new Error("Model ".concat(model.name, " has no primary key"));
    }
    if (idFields.length === 1) {
        // handle trivial one primary key case
        var idFieldName_1 = idFields[0];
        var idField = fields.find(function (f) { return f.name === idFieldName_1; });
        if (!idField || idField.type !== 'scalar') {
            throw new Error("Model ".concat(model.name, " must have a scalar primary key"));
        }
        return {
            name: idFieldName_1,
            type: 'scalar',
            scalarType: idField.scalarType
        };
    }
    // handle multiple primary key case
    var compoundUniqueName = idFields.join('_');
    var primaryKeyInputName = "".concat(model.name, "PrimaryKey");
    return {
        name: compoundUniqueName,
        type: 'nested',
        nestedType: {
            name: primaryKeyInputName,
            fields: idFields.map(function (idField) {
                var field = fields.find(function (f) { return f.name === idField; });
                if (!field || field.type !== 'scalar') {
                    throw new Error("ID field ".concat(idField, " in model ").concat(model.name, " must be a scalar"));
                }
                return {
                    name: idField,
                    type: 'scalar',
                    scalarType: field.scalarType
                };
            })
        }
    };
}
exports.getPrimaryKeyDefinition = getPrimaryKeyDefinition;
function getPrimaryKeyExpressions(model) {
    var idFields = model.idFields, fields = model.fields;
    if (!(idFields === null || idFields === void 0 ? void 0 : idFields.length)) {
        throw new Error("Model ".concat(model.name, " has no primary key"));
    }
    if (idFields.length === 1) {
        // handle trivial one primary key case
        var idFieldName_2 = idFields[0];
        var idField = fields.find(function (f) { return f.name === idFieldName_2; });
        if (!idField || idField.type !== 'scalar') {
            throw new Error("Model ".concat(model.name, " must have a scalar primary key"));
        }
        var argumentType = (0, fieldTypes_1.getScalarFieldTypeInfo)(idField.scalarType).typescriptType;
        return {
            argument: "".concat(idFieldName_2, ": ").concat(argumentType),
            whereClause: "{ ".concat(idFieldName_2, " }"),
            argumentType: argumentType
        };
    }
    // handle multiple primary key case
    var compoundUniqueName = idFields.join('_');
    var primaryKeyInputName = "".concat(model.name, "PrimaryKey");
    var headerTypeBlock = core_generators_1.TypescriptCodeUtils.createBlock("export type ".concat(primaryKeyInputName, " = Pick<").concat(model.name, ", ").concat(idFields
        .map(core_generators_1.quot)
        .join(' | '), ">"), "import {".concat(model.name, "} from '@prisma/client';"), {
        headerKey: primaryKeyInputName
    });
    return {
        argument: "".concat(compoundUniqueName, ": ").concat(primaryKeyInputName),
        whereClause: "{ ".concat(compoundUniqueName, " }"),
        headerTypeBlock: headerTypeBlock,
        argumentType: primaryKeyInputName
    };
}
exports.getPrimaryKeyExpressions = getPrimaryKeyExpressions;
