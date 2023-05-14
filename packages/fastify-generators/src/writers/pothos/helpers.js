"use strict";
exports.__esModule = true;
exports.getPothosMethodAndTypeForScalar = exports.wrapPothosTypeWithList = exports.writePothosFieldOptions = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var options_1 = require("./options");
function writePothosFieldOptions(fieldOptions) {
    var formattedFieldOptions = {
        required: fieldOptions.required ? 'true' : undefined,
        nullable: fieldOptions.nullable ? 'true' : undefined,
        type: fieldOptions.type
    };
    var hasFieldOptions = Object.values(formattedFieldOptions).some(function (a) { return a !== undefined; });
    return hasFieldOptions
        ? core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(formattedFieldOptions)
        : undefined;
}
exports.writePothosFieldOptions = writePothosFieldOptions;
function wrapPothosTypeWithList(expression, isList) {
    return isList ? expression.wrap(function (contents) { return "[".concat(contents, "]"); }) : expression;
}
exports.wrapPothosTypeWithList = wrapPothosTypeWithList;
function getPothosMethodAndTypeForScalar(field, options) {
    var _a = options.typeReferences.getScalar(field.scalarType), pothosMethod = _a.pothosMethod, scalarName = _a.name;
    // prefer use of .id instead of .uuid for IDs
    var pothosMethodWithId = field.isId && (field.scalarType === 'uuid' || field.scalarType === 'string')
        ? 'id'
        : pothosMethod;
    // ex: t.field('enum', { type: MyCoolEnum })
    if (field.scalarType === 'enum') {
        if (!field.enumType) {
            throw new Error("All enum types must have enumType specified!");
        }
        return {
            type: wrapPothosTypeWithList((0, options_1.getExpressionFromPothosTypeReference)(options.typeReferences.getEnum(field.enumType.name)), field.isList)
        };
    }
    // ex: t.id()
    if (pothosMethodWithId) {
        var pothosMethodWithList = "".concat(pothosMethodWithId).concat(field.isList ? 'List' : '');
        return {
            methodName: pothosMethodWithList
        };
    }
    // ex: t.field({type: "Uuid"});
    return {
        type: wrapPothosTypeWithList(new core_generators_1.TypescriptCodeExpression((0, core_generators_1.quot)(scalarName)))
    };
}
exports.getPothosMethodAndTypeForScalar = getPothosMethodAndTypeForScalar;
