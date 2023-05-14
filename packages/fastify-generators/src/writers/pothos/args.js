"use strict";
exports.__esModule = true;
exports.writePothosArgsFromDtoFields = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var ramda_1 = require("ramda");
var helpers_1 = require("./helpers");
var input_types_1 = require("./input-types");
function writePothosArgFromDtoScalarField(field, options) {
    var _a = (0, helpers_1.getPothosMethodAndTypeForScalar)(field, options), _b = _a.methodName, methodName = _b === void 0 ? 'arg' : _b, type = _a.type;
    var argOptions = (0, helpers_1.writePothosFieldOptions)({
        required: !field.isOptional,
        type: type
    });
    return {
        expression: core_generators_1.TypescriptCodeUtils.formatExpression('BUILDER.METHOD(OPTIONS)', {
            BUILDER: options.fieldBuilder,
            METHOD: methodName,
            OPTIONS: argOptions || ''
        }),
        childDefinitions: []
    };
}
function writePothosArgFromDtoNestedField(field, options) {
    var pothosType = (0, input_types_1.getPothosTypeForNestedInput)(field, options);
    var argOptions = (0, helpers_1.writePothosFieldOptions)({
        required: !field.isOptional,
        type: pothosType.expression
    });
    var expression = core_generators_1.TypescriptCodeUtils.formatExpression('BUILDER.arg(OPTIONS)', {
        BUILDER: options.fieldBuilder,
        OPTIONS: argOptions || ''
    });
    return { expression: expression, childDefinitions: pothosType.childDefinitions };
}
function writePothosArgsFromDtoFields(fields, options) {
    var argOutputs = fields.map(function (field) {
        var _a, _b;
        if (field.type === 'nested') {
            return _a = {}, _a[field.name] = writePothosArgFromDtoNestedField(field, options), _a;
        }
        return _b = {}, _b[field.name] = writePothosArgFromDtoScalarField(field, options), _b;
    });
    var argMap = ramda_1["default"].mergeAll(argOutputs);
    return {
        expression: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].mapObjIndexed(function (val) { return val.expression; }, argMap)),
        childDefinitions: Object.values(argMap).flatMap(function (arg) { return arg.childDefinitions || []; })
    };
}
exports.writePothosArgsFromDtoFields = writePothosArgsFromDtoFields;
