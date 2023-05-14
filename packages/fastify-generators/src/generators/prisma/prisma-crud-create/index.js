"use strict";
exports.__esModule = true;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var service_context_1 = require("@src/generators/core/service-context");
var service_file_1 = require("@src/generators/core/service-file");
var serviceOutput_1 = require("@src/types/serviceOutput");
var data_method_1 = require("../_shared/crud-method/data-method");
var prisma_1 = require("../prisma");
var prisma_crud_service_1 = require("../prisma-crud-service");
var prisma_utils_1 = require("../prisma-utils");
var descriptorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    modelName: zod_1.z.string().min(1),
    prismaFields: zod_1.z.array(zod_1.z.string().min(1)),
    transformerNames: zod_1.z.array(zod_1.z.string().min(1)).optional()
});
function getMethodDefinition(serviceMethodExpression, options) {
    var name = options.name, modelName = options.modelName, prismaOutput = options.prismaOutput;
    var prismaDefinition = prismaOutput.getPrismaModel(modelName);
    var dataType = (0, data_method_1.getDataMethodDataType)(options);
    var hasContext = (0, data_method_1.getDataMethodContextRequired)(options);
    return {
        name: name,
        expression: serviceMethodExpression,
        arguments: [
            {
                name: 'data',
                type: 'nested',
                nestedType: dataType
            },
        ],
        requiresContext: hasContext,
        returnType: (0, serviceOutput_1.prismaToServiceOutputDto)(prismaDefinition, function (enumName) {
            return prismaOutput.getServiceEnum(enumName);
        })
    };
}
function getMethodExpression(options) {
    var name = options.name, modelName = options.modelName, prismaOutput = options.prismaOutput, serviceContext = options.serviceContext, prismaUtils = options.prismaUtils;
    var createInputTypeName = "".concat(modelName, "CreateData");
    var typeHeaderBlock = (0, data_method_1.getDataInputTypeBlock)(createInputTypeName, options);
    var _a = (0, data_method_1.getDataMethodDataExpressions)(options), functionBody = _a.functionBody, createExpression = _a.createExpression, dataPipeNames = _a.dataPipeNames;
    var contextRequired = (0, data_method_1.getDataMethodContextRequired)(options);
    var modelType = prismaOutput.getModelTypeExpression(modelName);
    var operation = core_generators_1.TypescriptCodeUtils.formatExpression("PRISMA_MODEL.create(CREATE_ARGS)", {
        PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
        CREATE_ARGS: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject({
            data: createExpression
        })
    });
    return core_generators_1.TypescriptCodeUtils.formatExpression("\nasync METHOD_NAME(data: CREATE_INPUT_TYPE_NAME, CONTEXT): Promise<MODEL_TYPE> {\n  FUNCTION_BODY\n\n  return OPERATION;\n}\n".trim(), {
        METHOD_NAME: name,
        CREATE_INPUT_TYPE_NAME: createInputTypeName,
        MODEL_TYPE: modelType,
        CONTEXT: contextRequired
            ? serviceContext.getServiceContextType().prepend("context: ")
            : '',
        FUNCTION_BODY: functionBody,
        OPERATION: (0, data_method_1.wrapWithApplyDataPipe)(operation, dataPipeNames, prismaUtils)
    }, {
        headerBlocks: [typeHeaderBlock]
    });
}
var PrismaCrudCreateGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        prismaOutput: prisma_1.prismaOutputProvider,
        serviceFile: service_file_1.serviceFileProvider.dependency().modifiedInBuild(),
        crudPrismaService: prisma_crud_service_1.prismaCrudServiceProvider,
        serviceContext: service_context_1.serviceContextProvider,
        prismaUtils: prisma_utils_1.prismaUtilsProvider
    },
    createGenerator: function (descriptor, _a) {
        var prismaOutput = _a.prismaOutput, serviceFile = _a.serviceFile, crudPrismaService = _a.crudPrismaService, serviceContext = _a.serviceContext, prismaUtils = _a.prismaUtils;
        var name = descriptor.name, modelName = descriptor.modelName, prismaFields = descriptor.prismaFields, transformerNames = descriptor.transformerNames;
        var serviceMethodExpression = serviceFile
            .getServiceExpression()
            .append(".".concat(name));
        var transformerOption = {
            operationType: 'create'
        };
        var transformers = (transformerNames === null || transformerNames === void 0 ? void 0 : transformerNames.map(function (transformerName) {
            return crudPrismaService
                .getTransformerByName(transformerName)
                .buildTransformer(transformerOption);
        })) || [];
        return {
            getProviders: function () { return ({}); },
            build: function () {
                var methodOptions = {
                    name: name,
                    modelName: modelName,
                    prismaFieldNames: prismaFields,
                    prismaOutput: prismaOutput,
                    operationName: 'create',
                    isPartial: false,
                    transformers: transformers,
                    serviceContext: serviceContext,
                    prismaUtils: prismaUtils,
                    operationType: 'create',
                    whereUniqueExpression: null
                };
                serviceFile.registerMethod(name, getMethodExpression(methodOptions), getMethodDefinition(serviceMethodExpression, methodOptions));
            }
        };
    }
});
exports["default"] = PrismaCrudCreateGenerator;
