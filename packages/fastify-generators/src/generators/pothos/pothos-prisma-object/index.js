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
exports.pothosPrismaObjectProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var prisma_1 = require("@src/generators/prisma/prisma");
var pothos_type_1 = require("@src/providers/pothos-type");
var serviceOutput_1 = require("@src/types/serviceOutput");
var case_1 = require("@src/utils/case");
var pothos_1 = require("@src/writers/pothos");
var pothos_2 = require("../pothos");
var pothos_types_file_1 = require("../pothos-types-file");
var descriptorSchema = zod_1.z.object({
    modelName: zod_1.z.string().min(1),
    exposedFields: zod_1.z.array(zod_1.z.string().min(1))
});
exports.pothosPrismaObjectProvider = (0, sync_1.createProviderType)('pothos-prisma-object');
var createMainTask = (0, sync_1.createTaskConfigBuilder)(function (_a) {
    var modelName = _a.modelName, exposedFields = _a.exposedFields;
    return ({
        name: 'main',
        dependencies: {
            prismaOutput: prisma_1.prismaOutputProvider,
            pothosTypeFile: pothos_types_file_1.pothosTypesFileProvider,
            pothosSchema: pothos_2.pothosSchemaProvider
        },
        exports: {
            pothosPrismaObject: exports.pothosPrismaObjectProvider,
            pothosTypeOutput: pothos_type_1.pothosTypeOutputProvider
        },
        run: function (_a) {
            var prismaOutput = _a.prismaOutput, pothosTypeFile = _a.pothosTypeFile, pothosSchema = _a.pothosSchema;
            var model = prismaOutput.getPrismaModel(modelName);
            var exportName = "".concat((0, case_1.lowerCaseFirst)(model.name), "ObjectType");
            var customFields = (0, sync_1.createNonOverwriteableMap)({});
            return {
                getProviders: function () { return ({
                    pothosPrismaObject: {
                        addCustomField: function (name, expression) {
                            customFields.set(name, expression);
                        }
                    },
                    pothosTypeOutput: {
                        getTypeReference: function () { return ({
                            typeName: model.name,
                            exportName: exportName,
                            moduleName: pothosTypeFile.getModuleName()
                        }); }
                    }
                }); },
                build: function () {
                    var outputDto = (0, serviceOutput_1.prismaToServiceOutputDto)(model, function (enumName) {
                        return prismaOutput.getServiceEnum(enumName);
                    });
                    var typeReferences = pothosSchema.getTypeReferences();
                    var missingField = exposedFields.find(function (exposedFieldName) {
                        return !outputDto.fields.some(function (field) { return field.name === exposedFieldName; });
                    });
                    if (missingField) {
                        throw new Error("Field ".concat(missingField, " not found in model ").concat(model.name));
                    }
                    var fieldDefinitions = outputDto.fields
                        .filter(function (field) { return exposedFields.includes(field.name); })
                        .map(function (field) { return ({
                        name: field.name,
                        expression: field.type === 'scalar'
                            ? (0, pothos_1.writePothosExposeFieldFromDtoScalarField)(field, {
                                schemaBuilder: 'builder',
                                fieldBuilder: 't',
                                typeReferences: typeReferences
                            })
                            : "t.relation('".concat(field.name, "'").concat(field.isNullable ? ', { nullable: true }' : '', ")")
                    }); });
                    var objectTypeBlock = core_generators_1.TypescriptCodeUtils.formatBlock("export const OBJECT_TYPE_EXPORT = BUILDER.prismaObject(MODEL_NAME, {\n              fields: (t) => (FIELDS)\n            });", {
                        OBJECT_TYPE_EXPORT: exportName,
                        BUILDER: pothosTypeFile.getBuilder(),
                        MODEL_NAME: (0, core_generators_1.quot)(model.name),
                        FIELDS: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(__assign(__assign({}, Object.fromEntries(fieldDefinitions.map(function (fieldDefinition) { return [
                            fieldDefinition.name,
                            fieldDefinition.expression,
                        ]; }))), customFields.value()))
                    });
                    pothosTypeFile.registerType({
                        block: objectTypeBlock,
                        category: 'object-type'
                    });
                }
            };
        }
    });
});
var PothosPrismaObjectGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        taskBuilder.addTask(createMainTask(descriptor));
    }
});
exports["default"] = PothosPrismaObjectGenerator;
