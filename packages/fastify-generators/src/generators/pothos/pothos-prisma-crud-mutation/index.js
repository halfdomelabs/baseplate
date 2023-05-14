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
var service_file_1 = require("@src/generators/core/service-file");
var pothos_field_1 = require("@src/providers/pothos-field");
var pothos_type_1 = require("@src/providers/pothos-type");
var case_1 = require("@src/utils/case");
var pothos_1 = require("@src/writers/pothos");
var resolvers_1 = require("@src/writers/pothos/resolvers");
var pothos_2 = require("../pothos");
var pothos_types_file_1 = require("../pothos-types-file");
var descriptorSchema = zod_1.z.object({
    modelName: zod_1.z.string().min(1),
    type: zod_1.z["enum"](['create', 'update', 'delete']),
    objectTypeRef: zod_1.z.string().min(1),
    crudServiceRef: zod_1.z.string().min(1)
});
var createMainTask = (0, sync_1.createTaskConfigBuilder)(function (_a) {
    var modelName = _a.modelName, type = _a.type, objectTypeRef = _a.objectTypeRef, crudServiceRef = _a.crudServiceRef;
    return ({
        name: 'main',
        dependencies: {
            pothosSchema: pothos_2.pothosSchemaProvider,
            pothosTypesFile: pothos_types_file_1.pothosTypesFileProvider,
            serviceFileOutput: service_file_1.serviceFileOutputProvider
                .dependency()
                .reference(crudServiceRef),
            tsUtils: core_generators_1.tsUtilsProvider,
            pothosObjectType: pothos_type_1.pothosTypeOutputProvider
                .dependency()
                .reference(objectTypeRef)
        },
        exports: {
            pothosField: pothos_field_1.pothosFieldProvider
        },
        run: function (_a) {
            var pothosSchema = _a.pothosSchema, pothosTypesFile = _a.pothosTypesFile, serviceFileOutput = _a.serviceFileOutput, tsUtils = _a.tsUtils, pothosObjectType = _a.pothosObjectType;
            var serviceOutput = serviceFileOutput.getServiceMethod(type);
            var typeReferences = pothosSchema.getTypeReferences();
            var mutationName = "".concat(type).concat(modelName);
            var customFields = (0, sync_1.createNonOverwriteableMap)({});
            var inputFields = (0, pothos_1.writePothosInputFieldsFromDtoFields)(serviceOutput.arguments, {
                typeReferences: typeReferences,
                schemaBuilder: 'builder',
                fieldBuilder: 't.input'
            });
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
                    (_a = inputFields.childDefinitions) === null || _a === void 0 ? void 0 : _a.forEach(function (childDefinition) {
                        pothosTypesFile.registerType({
                            name: childDefinition.name,
                            block: childDefinition.definition
                        });
                    });
                    var returnFieldName = (0, case_1.lowerCaseFirst)(modelName);
                    var payloadFields = (0, pothos_1.writePothosSimpleObjectFieldsFromDtoFields)([
                        {
                            name: returnFieldName,
                            type: 'nested',
                            isPrismaType: true,
                            nestedType: { name: modelName }
                        },
                    ], {
                        typeReferences: typeReferences.cloneWithObjectType(pothosObjectType.getTypeReference()),
                        schemaBuilder: 'builder',
                        fieldBuilder: 't.payload'
                    });
                    var argNames = serviceOutput.arguments.map(function (arg) { return arg.name; });
                    var resolveFunction = core_generators_1.TypescriptCodeUtils.formatExpression("async (root, { input: INPUT_PARTS }, CONTEXT) => {\n              const RETURN_FIELD_NAME = await SERVICE_CALL(SERVICE_ARGUMENTS);\n              return { RETURN_FIELD_NAME };\n            }", {
                        INPUT_PARTS: "{ ".concat(argNames.join(', '), " }"),
                        CONTEXT: serviceOutput.requiresContext ? 'context' : '',
                        RETURN_FIELD_NAME: returnFieldName,
                        SERVICE_CALL: serviceOutput.expression,
                        SERVICE_ARGUMENTS: core_generators_1.TypescriptCodeUtils.mergeExpressions(serviceOutput.arguments.map(function (arg) {
                            return (0, resolvers_1.writeValueFromPothosArg)(arg, tsUtils);
                        }), ', ').append(serviceOutput.requiresContext ? ', context' : '')
                    });
                    var fieldOptions = __assign(__assign({ input: inputFields.expression, payload: payloadFields.expression }, customFields.value()), { resolve: resolveFunction });
                    var block = core_generators_1.TypescriptCodeUtils.formatBlock("BUILDER.mutationField(NAME, (t) =>\n            t.fieldWithInputPayload(OPTIONS)\n          );", {
                        BUILDER: 'builder',
                        NAME: (0, core_generators_1.quot)(mutationName),
                        OPTIONS: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(fieldOptions)
                    });
                    pothosTypesFile.registerType({
                        name: mutationName,
                        block: block
                    });
                }
            };
        }
    });
});
var PothosPrismaCrudMutationGenerator = (0, sync_1.createGeneratorWithTasks)({
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
exports["default"] = PothosPrismaCrudMutationGenerator;
