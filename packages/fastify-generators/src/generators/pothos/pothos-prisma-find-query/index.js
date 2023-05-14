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
var zod_1 = require("zod");
var primary_key_input_1 = require("@src/generators/prisma/_shared/crud-method/primary-key-input");
var prisma_1 = require("@src/generators/prisma/prisma");
var pothos_field_1 = require("@src/providers/pothos-field");
var case_1 = require("@src/utils/case");
var string_1 = require("@src/utils/string");
var pothos_1 = require("@src/writers/pothos");
var pothos_2 = require("../pothos");
var pothos_types_file_1 = require("../pothos-types-file");
var descriptorSchema = zod_1.z.object({
    modelName: zod_1.z.string().min(1)
});
var createMainTask = (0, sync_1.createTaskConfigBuilder)(function (_a) {
    var modelName = _a.modelName;
    return ({
        name: 'main',
        dependencies: {
            prismaOutput: prisma_1.prismaOutputProvider,
            pothosTypesFile: pothos_types_file_1.pothosTypesFileProvider,
            pothosSchema: pothos_2.pothosSchemaProvider
        },
        exports: {
            pothosField: pothos_field_1.pothosFieldProvider
        },
        run: function (_a) {
            var prismaOutput = _a.prismaOutput, pothosSchema = _a.pothosSchema, pothosTypesFile = _a.pothosTypesFile;
            var modelOutput = prismaOutput.getPrismaModel(modelName);
            var idFields = modelOutput.idFields;
            if (!idFields) {
                throw new Error("Model ".concat(modelName, " does not have an ID field"));
            }
            var primaryKeyDefinition = (0, primary_key_input_1.getPrimaryKeyDefinition)(modelOutput);
            var writerOptions = {
                schemaBuilder: 'builder',
                fieldBuilder: 't',
                typeReferences: pothosSchema.getTypeReferences()
            };
            var lowerFirstModelName = (0, case_1.lowerCaseFirst)(modelName);
            var customFields = (0, sync_1.createNonOverwriteableMap)({});
            return {
                getProviders: function () { return ({
                    pothosField: {
                        addCustomOption: function (field) {
                            customFields.set(field.name, field.value);
                        }
                    }
                }); },
                build: function () {
                    var _a;
                    var pothosArgs = (0, pothos_1.writePothosArgsFromDtoFields)([primaryKeyDefinition], writerOptions);
                    (_a = pothosArgs.childDefinitions) === null || _a === void 0 ? void 0 : _a.forEach(function (child) {
                        pothosTypesFile.registerType({
                            name: child.name,
                            block: child.definition
                        });
                    });
                    var resolveFunction = core_generators_1.TypescriptCodeUtils.formatExpression("async (query, root, ARG_INPUT, ctx) => MODEL.findUniqueOrThrow({...query,where: WHERE_CLAUSE})", {
                        ARG_INPUT: "{ ".concat(primaryKeyDefinition.name, " }"),
                        MODEL: prismaOutput.getPrismaModelExpression(modelName),
                        WHERE_CLAUSE: "{ ".concat(primaryKeyDefinition.name, " }")
                    });
                    var options = __assign(__assign({ type: (0, string_1.quot)(modelName) }, customFields.value()), { args: pothosArgs.expression, resolve: resolveFunction });
                    var block = core_generators_1.TypescriptCodeUtils.formatBlock("BUILDER.queryField(QUERY_NAME, (t) => \n          t.prismaField(OPTIONS)\n        );", {
                        QUERY_EXPORT: "".concat(lowerFirstModelName, "Query"),
                        BUILDER: 'builder',
                        QUERY_NAME: (0, string_1.quot)(lowerFirstModelName),
                        OPTIONS: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(options)
                    });
                    pothosTypesFile.registerType({
                        category: 'find-query',
                        block: block
                    });
                }
            };
        }
    });
});
var PothosPrismaFindQueryGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({
        authorize: {
            defaultToNullIfEmpty: true,
            defaultDescriptor: {
                generator: '@baseplate/fastify/pothos/pothos-authorize-field'
            }
        }
    }); },
    buildTasks: function (taskBuilder, descriptor) {
        taskBuilder.addTask(createMainTask(descriptor));
    }
});
exports["default"] = PothosPrismaFindQueryGenerator;
