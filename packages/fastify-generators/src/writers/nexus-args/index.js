"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.writeNexusArgsFromDtoFields = exports.writeNexusArgFromDtoNestedField = exports.writeNexusArgFromDtoScalarField = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var ramda_1 = require("ramda");
var nexus_definition_1 = require("../nexus-definition");
function writeNexusArgFromDtoScalarField(field, options) {
    var importTexts = [];
    var output = "'".concat(options.lookupScalar(field.scalarType).name, "'");
    if (field.isList) {
        output = "list(nonNull(".concat(output, "))");
        importTexts.push("import {list} from 'nexus'");
    }
    if (!field.isOptional) {
        output = "nonNull(".concat(output, ")");
        importTexts.push("import {nonNull} from 'nexus'");
    }
    return {
        expression: new core_generators_1.TypescriptCodeExpression(output, importTexts),
        childInputDefinitions: []
    };
}
exports.writeNexusArgFromDtoScalarField = writeNexusArgFromDtoScalarField;
function writeNexusArgFromDtoNestedField(field, options) {
    if (field.isPrismaType) {
        throw new Error("Prisma types not support in input types.");
    }
    var importTexts = [];
    var output = "'".concat(field.nestedType.name, "Input'");
    if (field.isList) {
        output = "list(nonNull(".concat(output, "))");
        importTexts.push("import {list} from 'nexus'");
    }
    if (!field.isOptional) {
        output = "nonNull(".concat(output, ")");
        importTexts.push("import {nonNull} from 'nexus'");
    }
    var _a = (0, nexus_definition_1.writeNexusInputDefinitionFromDtoFields)(field.nestedType.fields, options), childDefinition = _a.definition, childInputDefinitions = _a.childInputDefinitions;
    return {
        expression: new core_generators_1.TypescriptCodeExpression(output, importTexts),
        childInputDefinitions: __spreadArray([
            { name: field.nestedType.name, definition: childDefinition }
        ], childInputDefinitions, true)
    };
}
exports.writeNexusArgFromDtoNestedField = writeNexusArgFromDtoNestedField;
function writeNexusArgsFromDtoFields(fields, options) {
    var argOutputs = fields.map(function (field) {
        var _a, _b;
        if (field.type === 'nested') {
            return _a = {}, _a[field.name] = writeNexusArgFromDtoNestedField(field, options), _a;
        }
        return _b = {}, _b[field.name] = writeNexusArgFromDtoScalarField(field, options), _b;
    });
    var argMap = ramda_1["default"].mergeAll(argOutputs);
    return {
        expression: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].mapObjIndexed(function (val) { return val.expression; }, argMap)),
        childInputDefinitions: Object.values(argMap).flatMap(function (arg) { return arg.childInputDefinitions; })
    };
}
exports.writeNexusArgsFromDtoFields = writeNexusArgsFromDtoFields;
