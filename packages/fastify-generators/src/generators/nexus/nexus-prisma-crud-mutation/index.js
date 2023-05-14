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
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var inflection_1 = require("inflection");
var zod_1 = require("zod");
var service_file_1 = require("@src/generators/core/service-file");
var nexus_type_1 = require("@src/providers/nexus-type");
var case_1 = require("@src/utils/case");
var nexus_definition_1 = require("@src/writers/nexus-definition");
var nexus_1 = require("../nexus");
var nexus_types_file_1 = require("../nexus-types-file");
var descriptorSchema = zod_1.z.object({
    modelName: zod_1.z.string().min(1),
    type: zod_1.z["enum"](['create', 'update', 'delete']),
    crudServiceRef: zod_1.z.string().min(1)
});
// TODO: Use expression for createStandardMutation
var MUTATION_TEMPLATE = "\nexport const MUTATION_EXPORT = createStandardMutation({\n  name: MUTATION_NAME, // CUSTOM_FIELDS\n  inputDefinition(t) {\n    MUTATION_INPUT_DEFINITION;\n  },\n  payloadDefinition(t) {\n    t.nonNull.field('RETURN_FIELD_NAME', { type: OBJECT_TYPE_NAME });\n  },\n  async resolve(root, { input: INPUT_PARTS }, CONTEXT) {\n    const RETURN_FIELD_NAME = await SERVICE_CALL(SERVICE_ARGUMENTS);\n    return { RETURN_FIELD_NAME };\n  },\n});\n".trim();
function buildNestedArgExpression(arg, tsUtils) {
    if (arg.isPrismaType) {
        throw new Error("Prisma types are not supported in nested fields");
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
        throw new Error("Prisma types are not supported in nested fields");
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
function convertArgForCall(arg, tsUtils) {
    // TODO: Handle convert all nulls
    if (arg.isOptional && !arg.isNullable) {
        throw new Error("Optional non-nullable top-level args not handled");
    }
    if (arg.type === 'nested') {
        return convertNestedArgForCall(arg, tsUtils);
    }
    return new core_generators_1.TypescriptCodeExpression(arg.name);
}
var NexusPrismaCrudMutation = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({
        authorize: {
            defaultToNullIfEmpty: true,
            defaultDescriptor: {
                generator: '@baseplate/fastify/nexus/nexus-authorize-field'
            }
        }
    }); },
    dependencies: {
        nexusSchema: nexus_1.nexusSchemaProvider,
        nexusTypesFile: nexus_types_file_1.nexusTypesFileProvider,
        serviceFileOutput: service_file_1.serviceFileOutputProvider,
        tsUtils: core_generators_1.tsUtilsProvider
    },
    populateDependencies: function (dependencyMap, _a) {
        var crudServiceRef = _a.crudServiceRef;
        return (__assign(__assign({}, dependencyMap), { serviceFileOutput: dependencyMap.serviceFileOutput
                .dependency()
                .reference(crudServiceRef) }));
    },
    exports: {
        nexusType: nexus_type_1.nexusTypeProvider
    },
    createGenerator: function (_a, _b) {
        var modelName = _a.modelName, type = _a.type;
        var nexusSchema = _b.nexusSchema, nexusTypesFile = _b.nexusTypesFile, serviceFileOutput = _b.serviceFileOutput, tsUtils = _b.tsUtils;
        var serviceOutput = serviceFileOutput.getServiceMethod(type);
        var objectTypeBlock = new core_generators_1.TypescriptSourceBlock({
            MUTATION_EXPORT: { type: 'code-expression' },
            MUTATION_NAME: { type: 'code-expression' },
            CUSTOM_FIELDS: {
                type: 'string-replacement',
                asSingleLineComment: true,
                transform: function (value) { return "\n".concat(value, ","); }
            },
            MUTATION_INPUT_DEFINITION: { type: 'code-block' },
            OBJECT_TYPE_NAME: { type: 'code-expression' },
            INPUT_PARTS: { type: 'code-expression' },
            CONTEXT: { type: 'code-expression' },
            SERVICE_CALL: { type: 'code-expression' },
            SERVICE_ARGUMENTS: { type: 'code-expression' },
            RETURN_FIELD_NAME: { type: 'code-expression' }
        }, {
            importText: [
                "import { createStandardMutation } from '".concat(nexusSchema.getUtilsImport(), "';"),
            ]
        });
        var inputDefinitions = (0, nexus_definition_1.writeNexusInputDefinitionFromDtoFields)(serviceOutput.arguments, {
            builder: 't',
            lookupScalar: function (scalar) { return nexusSchema.getScalarConfig(scalar); }
        });
        var argNames = serviceOutput.arguments.map(function (arg) { return arg.name; });
        objectTypeBlock.addCodeEntries({
            MUTATION_EXPORT: "".concat(type).concat(modelName, "Mutation"),
            MUTATION_NAME: "'".concat(type).concat(modelName, "'"),
            MUTATION_INPUT_DEFINITION: inputDefinitions.definition,
            OBJECT_TYPE_NAME: "'".concat(modelName, "'"),
            INPUT_PARTS: "{ ".concat(argNames.join(', '), " }"),
            CONTEXT: serviceOutput.requiresContext ? 'context' : '',
            SERVICE_CALL: serviceOutput.expression,
            SERVICE_ARGUMENTS: core_generators_1.TypescriptCodeUtils.mergeExpressions(serviceOutput.arguments.map(function (arg) { return convertArgForCall(arg, tsUtils); }), ', ').append(serviceOutput.requiresContext ? ', context' : ''),
            RETURN_FIELD_NAME: (0, case_1.lowerCaseFirst)(modelName)
        });
        inputDefinitions.childInputDefinitions.forEach(function (child) {
            nexusTypesFile.registerType({
                name: child.name,
                block: (0, nexus_definition_1.writeChildInputDefinition)(child)
            });
        });
        return {
            getProviders: function () { return ({
                nexusType: {
                    addCustomField: function (fieldName, fieldType) {
                        objectTypeBlock.addStringReplacement('CUSTOM_FIELDS', fieldType.prepend("".concat(fieldName, ": ")).toStringReplacement());
                    }
                }
            }); },
            build: function () {
                // TODO: Make it easier to do simple replaces
                nexusTypesFile.registerType({
                    block: objectTypeBlock.renderToBlock(MUTATION_TEMPLATE.replace('RETURN_FIELD_NAME', (0, case_1.lowerCaseFirst)(modelName)))
                });
            }
        };
    }
});
exports["default"] = NexusPrismaCrudMutation;
