"use strict";
exports.__esModule = true;
exports.writePothosExposeFieldFromDtoScalarField = exports.writePothosObjectFieldFromDtoScalarField = exports.writePothosInputFieldFromDtoScalarField = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var case_1 = require("@src/utils/case");
var helpers_1 = require("./helpers");
function writePothosInputFieldFromDtoScalarField(field, options) {
    var _a = (0, helpers_1.getPothosMethodAndTypeForScalar)(field, options), _b = _a.methodName, methodName = _b === void 0 ? 'field' : _b, type = _a.type;
    var fieldOptions = (0, helpers_1.writePothosFieldOptions)({
        required: !field.isOptional,
        type: type
    });
    return core_generators_1.TypescriptCodeUtils.formatExpression("BUILDER.POTHOS_METHOD(".concat(fieldOptions ? 'OPTIONS' : '', ")"), {
        BUILDER: options.fieldBuilder,
        POTHOS_METHOD: methodName,
        OPTIONS: fieldOptions || ''
    });
}
exports.writePothosInputFieldFromDtoScalarField = writePothosInputFieldFromDtoScalarField;
function writePothosObjectFieldFromDtoScalarField(field, options) {
    var _a = (0, helpers_1.getPothosMethodAndTypeForScalar)(field, options), _b = _a.methodName, methodName = _b === void 0 ? 'field' : _b, type = _a.type;
    var fieldOptions = (0, helpers_1.writePothosFieldOptions)({
        nullable: field.isOptional,
        type: type
    });
    return core_generators_1.TypescriptCodeUtils.formatExpression("BUILDER.POTHOS_METHOD(".concat(fieldOptions ? 'OPTIONS' : '', ")"), {
        BUILDER: options.fieldBuilder,
        POTHOS_METHOD: methodName,
        OPTIONS: fieldOptions || ''
    });
}
exports.writePothosObjectFieldFromDtoScalarField = writePothosObjectFieldFromDtoScalarField;
function writePothosExposeFieldFromDtoScalarField(field, options) {
    var _a = (0, helpers_1.getPothosMethodAndTypeForScalar)(field, options), methodName = _a.methodName, type = _a.type;
    var fieldOptions = (0, helpers_1.writePothosFieldOptions)({
        nullable: field.isOptional,
        type: type
    });
    var exposeMethodName = methodName
        ? // exposeID instead of exposeId
            "expose".concat((0, case_1.upperCaseFirst)(methodName === 'id' ? 'ID' : methodName))
        : 'expose';
    return core_generators_1.TypescriptCodeUtils.formatExpression("BUILDER.POTHOS_METHOD(FIELD_NAME".concat(fieldOptions ? ', OPTIONS' : '', ")"), {
        BUILDER: options.fieldBuilder,
        FIELD_NAME: (0, core_generators_1.quot)(field.name),
        POTHOS_METHOD: exposeMethodName,
        OPTIONS: fieldOptions || ''
    });
}
exports.writePothosExposeFieldFromDtoScalarField = writePothosExposeFieldFromDtoScalarField;
