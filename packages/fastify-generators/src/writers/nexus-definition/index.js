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
exports.writeChildInputDefinition = exports.writeScalarNexusDefinitionFromDtoFields = exports.writeNexusInputDefinitionFromDtoFields = exports.writeNexusDefinitionFromDtoScalarField = exports.writeNexusObjectTypeFieldFromDtoNestedField = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var case_1 = require("@src/utils/case");
function writeNexusObjectTypeFieldFromDtoNestedField(field, resolver, options) {
    var components = [options.builder];
    if (!field.isOptional) {
        components.push('.nonNull');
    }
    if (field.isList) {
        components.push('.list.nonNull');
    }
    components.push(".field(\"".concat(field.name, "\", { type: '").concat(field.nestedType.name, "', resolve: RESOLVER })"));
    var fieldStr = components.join('');
    return resolver
        .wrap(function (contents) { return fieldStr.replace('RESOLVER', contents); })
        .toBlock();
}
exports.writeNexusObjectTypeFieldFromDtoNestedField = writeNexusObjectTypeFieldFromDtoNestedField;
function writeNexusDefinitionFromDtoScalarField(field, options) {
    var components = [options.builder];
    if (!field.isOptional) {
        components.push('.nonNull');
    }
    if (field.isList) {
        components.push('.list.nonNull');
    }
    var nexusMethod = options.lookupScalar(field.scalarType).nexusMethod;
    // prefer use of .id instead of .uuid for IDs
    var nexusMethodWithId = field.isId && (field.scalarType === 'uuid' || field.scalarType === 'string')
        ? 'id'
        : nexusMethod;
    if (!nexusMethodWithId) {
        if (field.scalarType !== 'enum' || !field.enumType) {
            throw new Error("Field must have nexus type or be enum!");
        }
        components.push(".field(\"".concat(field.name, "\", { type: \"").concat(field.enumType.name, "\" })"));
    }
    else {
        components.push(".".concat(nexusMethodWithId, "(\"").concat(field.name, "\")"));
    }
    return components.join('');
}
exports.writeNexusDefinitionFromDtoScalarField = writeNexusDefinitionFromDtoScalarField;
function writeNexusInputDefinitionFromDtoNestedField(field, options) {
    var components = [options.builder];
    if (!field.isOptional) {
        components.push('.nonNull');
    }
    if (field.isList) {
        components.push('.list.nonNull');
    }
    components.push(".field(\"".concat(field.name, "\", { type: '").concat(field.schemaFieldName || "".concat(field.nestedType.name, "Input"), "' })"));
    return components.join('');
}
function writeNexusInputDefinitionFromDtoFields(fields, options) {
    var inputDefinitions = fields.map(function (field) {
        if (field.type === 'nested') {
            if (field.schemaFieldName) {
                return {
                    definition: writeNexusInputDefinitionFromDtoNestedField(field, options),
                    childInputDefinitions: []
                };
            }
            if (field.isPrismaType) {
                throw new Error("Prisma types not support in input types.");
            }
            var _a = writeNexusInputDefinitionFromDtoFields(field.nestedType.fields, options), childDefinition = _a.definition, childInputDefinitions = _a.childInputDefinitions;
            return {
                definition: writeNexusInputDefinitionFromDtoNestedField(field, options),
                childInputDefinitions: __spreadArray([
                    { name: field.nestedType.name, definition: childDefinition }
                ], childInputDefinitions, true)
            };
        }
        return {
            definition: writeNexusDefinitionFromDtoScalarField(field, options),
            childInputDefinitions: []
        };
    });
    return {
        definition: inputDefinitions.map(function (d) { return d.definition; }).join('\n'),
        childInputDefinitions: inputDefinitions.flatMap(function (d) { return d.childInputDefinitions; })
    };
}
exports.writeNexusInputDefinitionFromDtoFields = writeNexusInputDefinitionFromDtoFields;
function writeScalarNexusDefinitionFromDtoFields(fields, options) {
    return fields
        .filter(function (field) { return field.type === 'scalar'; })
        .map(function (field) { return writeNexusDefinitionFromDtoScalarField(field, options); })
        .join('\n');
}
exports.writeScalarNexusDefinitionFromDtoFields = writeScalarNexusDefinitionFromDtoFields;
var CHILD_INPUT_TYPE_TEMPLATE = "\nexport const INPUT_TYPE_EXPORT = inputObjectType({\n  name: 'INPUT_TYPE_NAME',\n  definition(t) {\nINPUT_PAYLOAD\n  },\n});\n".trim();
function writeChildInputDefinition(child) {
    var contents = CHILD_INPUT_TYPE_TEMPLATE.replace('INPUT_TYPE_EXPORT', "".concat((0, case_1.lowerCaseFirst)(child.name), "Input"))
        .replace('INPUT_TYPE_NAME', "".concat(child.name, "Input"))
        .replace('INPUT_PAYLOAD', child.definition);
    return new core_generators_1.TypescriptCodeBlock(contents, "import { inputObjectType } from 'nexus'");
}
exports.writeChildInputDefinition = writeChildInputDefinition;
