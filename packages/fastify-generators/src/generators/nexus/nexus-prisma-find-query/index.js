"use strict";
exports.__esModule = true;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var primary_key_input_1 = require("@src/generators/prisma/_shared/crud-method/primary-key-input");
var prisma_1 = require("@src/generators/prisma/prisma");
var nexus_type_1 = require("@src/providers/nexus-type");
var case_1 = require("@src/utils/case");
var string_1 = require("@src/utils/string");
var nexus_args_1 = require("@src/writers/nexus-args");
var nexus_definition_1 = require("@src/writers/nexus-definition");
var nexus_1 = require("../nexus");
var nexus_types_file_1 = require("../nexus-types-file");
var descriptorSchema = zod_1.z.object({
    modelName: zod_1.z.string().min(1),
    objectTypeName: zod_1.z.string().optional()
});
var QUERY_TYPE_TEMPLATE = "\nexport const QUERY_EXPORT = queryField((t) => {\n  t.field(QUERY_NAME, {\n    type: nonNull(OBJECT_TYPE_NAME), // CUSTOM_FIELDS\n    args: QUERY_ARGS,\n    resolve: async (root, ARG_INPUT, ctx, info) => MODEL.findUniqueOrThrow({where: MODEL_WHERE}),\n  });\n});\n".trim();
var NexusPrismaListQueryGenerator = (0, sync_1.createGeneratorWithChildren)({
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
        prismaOutput: prisma_1.prismaOutputProvider,
        nexusTypesFile: nexus_types_file_1.nexusTypesFileProvider,
        nexusSchema: nexus_1.nexusSchemaProvider
    },
    exports: {
        nexusType: nexus_type_1.nexusTypeProvider
    },
    createGenerator: function (_a, _b) {
        var modelName = _a.modelName, objectTypeName = _a.objectTypeName;
        var prismaOutput = _b.prismaOutput, nexusTypesFile = _b.nexusTypesFile, nexusSchema = _b.nexusSchema;
        var modelOutput = prismaOutput.getPrismaModel(modelName);
        var idFields = modelOutput.idFields;
        if (!idFields) {
            throw new Error("Model ".concat(modelName, " does not have an ID field"));
        }
        var objectTypeBlock = new core_generators_1.TypescriptSourceBlock({
            CUSTOM_FIELDS: {
                type: 'string-replacement',
                asSingleLineComment: true,
                transform: function (value) { return "\n".concat(value, ","); }
            },
            QUERY_EXPORT: { type: 'code-expression' },
            QUERY_NAME: { type: 'code-expression' },
            OBJECT_TYPE_NAME: { type: 'code-expression' },
            QUERY_ARGS: { type: 'code-expression' },
            MODEL: { type: 'code-expression' },
            ARG_INPUT: { type: 'code-expression' },
            MODEL_WHERE: { type: 'code-expression' }
        }, {
            importText: ["import { queryField, nonNull } from 'nexus';"]
        });
        var primaryKeyDefinition = (0, primary_key_input_1.getPrimaryKeyDefinition)(modelOutput);
        var writerOptions = {
            builder: 't',
            lookupScalar: function (scalar) { return nexusSchema.getScalarConfig(scalar); }
        };
        var lowerFirstModelName = (0, case_1.lowerCaseFirst)(modelName);
        var nexusArgs = (0, nexus_args_1.writeNexusArgsFromDtoFields)([primaryKeyDefinition], writerOptions);
        nexusArgs.childInputDefinitions.forEach(function (child) {
            nexusTypesFile.registerType({
                name: child.name,
                block: (0, nexus_definition_1.writeChildInputDefinition)(child)
            });
        });
        objectTypeBlock.addCodeEntries({
            QUERY_EXPORT: "".concat(lowerFirstModelName, "Query"),
            QUERY_NAME: (0, string_1.quot)(lowerFirstModelName),
            OBJECT_TYPE_NAME: "'".concat(objectTypeName || modelName, "'"),
            QUERY_ARGS: nexusArgs.expression,
            MODEL: prismaOutput.getPrismaModelExpression(modelName),
            ARG_INPUT: "{ ".concat(primaryKeyDefinition.name, " }"),
            MODEL_WHERE: "{ ".concat(primaryKeyDefinition.name, " }")
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
                nexusTypesFile.registerType({
                    category: 'find-query',
                    block: objectTypeBlock.renderToBlock(QUERY_TYPE_TEMPLATE)
                });
            }
        };
    }
});
exports["default"] = NexusPrismaListQueryGenerator;
