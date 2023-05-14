"use strict";
exports.__esModule = true;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var inflection_1 = require("inflection");
var zod_1 = require("zod");
var prisma_1 = require("@src/generators/prisma/prisma");
var nexus_type_1 = require("@src/providers/nexus-type");
var case_1 = require("@src/utils/case");
var nexus_types_file_1 = require("../nexus-types-file");
var descriptorSchema = zod_1.z.object({
    modelName: zod_1.z.string().min(1),
    objectTypeName: zod_1.z.string().optional()
});
var LIST_TYPE_TEMPLATE = "\nexport const LIST_QUERY_EXPORT = queryField((t) => {\n  t.field(QUERY_NAME, {\n    type: nonNull(list(nonNull(OBJECT_TYPE_NAME))), // CUSTOM_FIELDS\n    resolve: async (root, args, ctx, info) => MODEL.findMany({}),\n  });\n});\n".trim();
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
        nexusTypesFile: nexus_types_file_1.nexusTypesFileProvider
    },
    exports: {
        nexusType: nexus_type_1.nexusTypeProvider
    },
    createGenerator: function (_a, _b) {
        var modelName = _a.modelName, objectTypeName = _a.objectTypeName;
        var prismaOutput = _b.prismaOutput, nexusTypesFile = _b.nexusTypesFile;
        var objectTypeBlock = new core_generators_1.TypescriptSourceBlock({
            CUSTOM_FIELDS: {
                type: 'string-replacement',
                asSingleLineComment: true,
                transform: function (value) { return "\n".concat(value, ","); }
            },
            LIST_QUERY_EXPORT: { type: 'code-expression' },
            QUERY_NAME: { type: 'code-expression' },
            OBJECT_TYPE_NAME: { type: 'code-expression' },
            MODEL: { type: 'code-expression' }
        }, {
            importText: ["import { queryField, nonNull, list } from 'nexus';"]
        });
        var lowerFirstModelName = (0, case_1.lowerCaseFirst)(modelName);
        objectTypeBlock.addCodeEntries({
            LIST_QUERY_EXPORT: "".concat(inflection_1["default"].pluralize(lowerFirstModelName), "Query"),
            QUERY_NAME: "'".concat(inflection_1["default"].pluralize(lowerFirstModelName), "'"),
            OBJECT_TYPE_NAME: "'".concat(objectTypeName || modelName, "'"),
            MODEL: prismaOutput.getPrismaModelExpression(modelName)
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
                    block: objectTypeBlock.renderToBlock(LIST_TYPE_TEMPLATE),
                    category: 'list-query'
                });
            }
        };
    }
});
exports["default"] = NexusPrismaListQueryGenerator;
