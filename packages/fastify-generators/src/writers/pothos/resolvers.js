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
exports.__esModule = true;
exports.writeValueFromPothosArg = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var inflection_1 = require("inflection");
function buildNestedArgExpression(arg, tsUtils) {
    if (arg.isPrismaType) {
        throw new Error("Prisma types are not supported in input fields");
    }
    var fields = arg.nestedType.fields;
    var nestedFields = fields.filter(function (f) { return f.type === 'nested'; });
    if (nestedFields.length) {
        // look for all nested expressions with restrictions
        var nestedExpressionsWithRestrict = nestedFields
            .map(function (nestedField) { return ({
            field: nestedField,
            // mutual recursion
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            expression: convertNestedArgForCall(__assign(__assign({}, nestedField), { name: nestedField.isList
                    ? (0, inflection_1.singularize)(nestedField.name)
                    : "".concat(arg.name, ".").concat(nestedField.name) }), tsUtils)
        }); })
            .filter(function (f) { return f.expression.content.includes('restrictObjectNulls'); });
        if (nestedExpressionsWithRestrict.length) {
            return core_generators_1.TypescriptCodeUtils.formatExpression("{\n          ...".concat(arg.name, ",\n          RESTRICT_EXPRESSIONS\n        }"), {
                RESTRICT_EXPRESSIONS: core_generators_1.TypescriptCodeUtils.mergeExpressions(nestedExpressionsWithRestrict.map(function (_a) {
                    var field = _a.field, expression = _a.expression;
                    if (field.isList) {
                        return expression.wrap(function (contents) {
                            return "".concat(field.name, ": ").concat(arg.name, ".").concat(field.name, "?.map((").concat((0, inflection_1.singularize)(field.name), ") => ").concat(contents.trimStart().startsWith('{')
                                ? "(".concat(contents, ")")
                                : contents, ")");
                        });
                    }
                    return expression.wrap(function (contents) {
                        return "".concat(field.name, ": ").concat(arg.name, ".").concat(field.name, " && ").concat(contents);
                    });
                }), ',\n')
            });
        }
    }
    return new core_generators_1.TypescriptCodeExpression(arg.name);
}
function convertNestedArgForCall(arg, tsUtils) {
    if (arg.isPrismaType) {
        throw new Error("Prisma types are not supported in input fields");
    }
    var fields = arg.nestedType.fields;
    var nonNullableOptionalFields = fields.filter(function (f) { return f.isOptional && !f.isNullable; });
    var nestedArgExpression = buildNestedArgExpression(arg, tsUtils);
    if (nonNullableOptionalFields.length) {
        return core_generators_1.TypescriptCodeUtils.formatExpression("restrictObjectNulls(ARG, [".concat(nonNullableOptionalFields
            .map(function (f) { return "'".concat(f.name, "'"); })
            .join(', '), "])"), { ARG: nestedArgExpression }, {
            importText: ["import {restrictObjectNulls} from '%ts-utils/nulls';"],
            importMappers: [tsUtils]
        });
    }
    return nestedArgExpression;
}
function writeValueFromPothosArg(arg, tsUtils) {
    // TODO: Handle convert all nulls
    if (arg.isOptional && !arg.isNullable) {
        throw new Error("Optional non-nullable top-level args not handled");
    }
    if (arg.type === 'nested') {
        return convertNestedArgForCall(arg, tsUtils);
    }
    return new core_generators_1.TypescriptCodeExpression(arg.name);
}
exports.writeValueFromPothosArg = writeValueFromPothosArg;
