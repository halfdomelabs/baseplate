"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
exports.getPothosTypeForNestedObject = exports.writePothosSimpleObjectDefinitionFromDtoFields = exports.writePothosSimpleObjectFieldsFromDtoFields = exports.writeSimplePothosObjectFieldFromDtoNestedField = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var array_1 = require("@src/utils/array");
var case_1 = require("@src/utils/case");
var helpers_1 = require("./helpers");
var options_1 = require("./options");
var scalar_fields_1 = require("./scalar-fields");
function writeSimplePothosObjectFieldFromDtoNestedField(field, options) {
    // recursive call
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    var pothosType = getPothosTypeForNestedObject(field, options);
    var fieldOptions = (0, helpers_1.writePothosFieldOptions)({
        nullable: field.isOptional,
        type: pothosType.expression
    });
    return {
        expression: core_generators_1.TypescriptCodeUtils.formatExpression("BUILDER.field(OPTIONS)", {
            BUILDER: options.fieldBuilder,
            OPTIONS: fieldOptions || ''
        }),
        childDefinitions: pothosType.childDefinitions
    };
}
exports.writeSimplePothosObjectFieldFromDtoNestedField = writeSimplePothosObjectFieldFromDtoNestedField;
function writePothosSimpleObjectFieldsFromDtoFields(fields, options) {
    var pothosFields = fields.map(function (field) {
        if (field.type === 'scalar') {
            return {
                expression: (0, scalar_fields_1.writePothosObjectFieldFromDtoScalarField)(field, options)
            };
        }
        return writeSimplePothosObjectFieldFromDtoNestedField(field, options);
    });
    return {
        expression: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(Object.fromEntries(pothosFields.map(function (field, i) { return [fields[i].name, field.expression]; })), { wrapWithParenthesis: true }),
        childDefinitions: pothosFields
            .flatMap(function (field) { return field.childDefinitions; })
            .filter(array_1.notEmpty)
    };
}
exports.writePothosSimpleObjectFieldsFromDtoFields = writePothosSimpleObjectFieldsFromDtoFields;
function writePothosSimpleObjectDefinitionFromDtoFields(name, fields, options) {
    var pothosFields = writePothosSimpleObjectFieldsFromDtoFields(fields, __assign(__assign({}, options), { fieldBuilder: 't' }));
    var exportName = "".concat((0, case_1.lowerCaseFirst)(name), "ObjectType");
    var definition = core_generators_1.TypescriptCodeUtils.formatBlock("const EXPORT_NAME = BUILDER.simpleObject(NAME, {\n      fields: (t) => FIELDS\n    })", {
        EXPORT_NAME: exportName,
        BUILDER: options.schemaBuilder,
        NAME: (0, core_generators_1.quot)(name),
        FIELDS: pothosFields.expression
    });
    return {
        name: name,
        exportName: exportName,
        definition: definition,
        childDefinitions: pothosFields.childDefinitions
    };
}
exports.writePothosSimpleObjectDefinitionFromDtoFields = writePothosSimpleObjectDefinitionFromDtoFields;
function getPothosTypeForNestedObject(field, options) {
    var name = field.nestedType.name;
    var objectType = options.typeReferences.getObjectType(name);
    if (objectType) {
        return {
            expression: (0, helpers_1.wrapPothosTypeWithList)((0, options_1.getExpressionFromPothosTypeReference)(objectType), field.isList)
        };
    }
    if (field.isPrismaType) {
        throw new Error("Prisma type ".concat(name, " not found in type references"));
    }
    var fields = field.nestedType.fields;
    var _a = writePothosSimpleObjectDefinitionFromDtoFields(name, fields, options), childDefinitions = _a.childDefinitions, objectDefinition = __rest(_a, ["childDefinitions"]);
    return {
        expression: (0, helpers_1.wrapPothosTypeWithList)(core_generators_1.TypescriptCodeUtils.createExpression(objectDefinition.exportName), field.isList),
        childDefinitions: __spreadArray([objectDefinition], (childDefinitions || []), true)
    };
}
exports.getPothosTypeForNestedObject = getPothosTypeForNestedObject;
