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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var service_context_1 = require("@src/generators/core/service-context");
var array_1 = require("@src/utils/array");
var case_1 = require("@src/utils/case");
var data_method_1 = require("../_shared/crud-method/data-method");
var prisma_1 = require("../prisma");
var prisma_crud_service_1 = require("../prisma-crud-service");
var prisma_utils_1 = require("../prisma-utils");
var descriptorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    inputName: zod_1.z.string().optional(),
    localRelationName: zod_1.z.string().optional(),
    embeddedFieldNames: zod_1.z.array(zod_1.z.string().min(1)),
    foreignCrudServiceRef: zod_1.z.string().optional(),
    embeddedTransformerNames: zod_1.z.array(zod_1.z.string().min(1)).optional()
});
function getForeignModelRelation(prismaOutput, modelName, localRelationName) {
    var localModel = prismaOutput.getPrismaModel(modelName);
    var localRelation = localModel.fields.find(function (f) { return f.name === localRelationName; });
    if (!localRelation || localRelation.type !== 'relation') {
        throw new Error("".concat(modelName, ".").concat(localRelationName, " is not a relation field"));
    }
    // find the relationship on the foreign model since that's where the details of the relation exist
    var foreignModel = prismaOutput.getPrismaModel(localRelation.modelType);
    var foreignRelation = foreignModel.fields.find(function (f) {
        return f.type === 'relation' &&
            (localRelation.relationName
                ? f.name === localRelation.relationName
                : f.modelType === modelName);
    });
    if (!foreignRelation) {
        throw new Error("Could not find foreign relation on ".concat(localRelation.modelType, " for ").concat(modelName, ".").concat(localRelationName));
    }
    return { localModel: localModel, foreignModel: foreignModel, localRelation: localRelation, foreignRelation: foreignRelation };
}
function createEmbeddedTransformFunction(options) {
    var name = options.name, inputDataType = options.inputDataType, outputDataType = options.outputDataType, serviceContextType = options.serviceContextType, prismaUtils = options.prismaUtils, isOneToOne = options.isOneToOne, dataMethodOptions = options.dataMethodOptions, whereUniqueType = options.whereUniqueType;
    var isAsync = dataMethodOptions.transformers.some(function (t) { return t.isAsync; });
    var _a = (0, data_method_1.getDataMethodDataExpressions)(dataMethodOptions), functionBody = _a.functionBody, createExpression = _a.createExpression, updateExpression = _a.updateExpression, dataPipeNames = _a.dataPipeNames;
    var outputPipeType = core_generators_1.TypescriptCodeUtils.createExpression("DataPipeOutput<".concat(outputDataType, ">"), "import { DataPipeOutput } from '%prisma-utils/dataPipes';", { importMappers: [prismaUtils] });
    var outputType = isAsync
        ? outputPipeType.wrap(function (contents) { return "Promise<".concat(contents, ">"); })
        : outputPipeType;
    var func = core_generators_1.TypescriptCodeUtils.formatBlock("".concat(isAsync ? 'async ' : '', "function FUNC_NAME(data: INPUT_DATA_TYPE, context: CONTEXT_TYPE, whereUnique?: WHERE_UNIQUE_TYPE, parentId?: string): OUTPUT_TYPE {\n      FUNCTION_BODY\n\n      return DATA_RESULT;\n    }"), {
        FUNC_NAME: name,
        INPUT_DATA_TYPE: inputDataType,
        FUNCTION_BODY: functionBody,
        WHERE_UNIQUE_TYPE: whereUniqueType,
        DATA_RESULT: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject({
            data: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject({
                where: isOneToOne ? undefined : 'whereUnique || {}',
                create: createExpression,
                update: updateExpression
            }),
            operations: !dataPipeNames.length
                ? undefined
                : core_generators_1.TypescriptCodeUtils.createExpression("mergePipeOperations([".concat(dataPipeNames.join(', '), "])"), "import { mergePipeOperations } from '%prisma-utils/dataPipes';", { importMappers: [prismaUtils] })
        }),
        OUTPUT_TYPE: outputType,
        CONTEXT_TYPE: serviceContextType
    }).withHeaderKey(name);
    return {
        name: name,
        func: func
    };
}
var EmbeddedRelationTransformerGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        prismaOutput: prisma_1.prismaOutputProvider,
        prismaCrudServiceSetup: prisma_crud_service_1.prismaCrudServiceSetupProvider,
        foreignCrudService: prisma_crud_service_1.prismaCrudServiceProvider.dependency().optional(),
        serviceContext: service_context_1.serviceContextProvider,
        prismaUtils: prisma_utils_1.prismaUtilsProvider
    },
    populateDependencies: function (dependencies, _a) {
        var foreignCrudServiceRef = _a.foreignCrudServiceRef;
        return (__assign(__assign({}, dependencies), { foreignCrudService: foreignCrudServiceRef
                ? dependencies.foreignCrudService.reference(foreignCrudServiceRef)
                : dependencies.foreignCrudService.resolveToNull() }));
    },
    createGenerator: function (_a, _b) {
        var _this = this;
        var localRelationName = _a.name, _c = _a.embeddedFieldNames, embeddedFieldNames = _c === void 0 ? [] : _c, embeddedTransformerNames = _a.embeddedTransformerNames, inputNameDescriptor = _a.inputName;
        var prismaOutput = _b.prismaOutput, prismaCrudServiceSetup = _b.prismaCrudServiceSetup, foreignCrudService = _b.foreignCrudService, serviceContext = _b.serviceContext, prismaUtils = _b.prismaUtils;
        function buildTransformer(_a) {
            var _b;
            var operationType = _a.operationType;
            var modelName = prismaCrudServiceSetup.getModelName();
            var inputName = inputNameDescriptor || localRelationName;
            var _c = getForeignModelRelation(prismaOutput, modelName, localRelationName), localModel = _c.localModel, foreignModel = _c.foreignModel, localRelation = _c.localRelation, foreignRelation = _c.foreignRelation;
            if (((_b = localModel.idFields) === null || _b === void 0 ? void 0 : _b.length) !== 1) {
                throw new Error("".concat(modelName, " must have exactly one id field if used in an embedded relation"));
            }
            var localId = localModel.idFields[0];
            if (embeddedTransformerNames && !foreignCrudService) {
                throw new Error("Cannot use embedded transformers without a foreign crud service");
            }
            var isOneToOne = !localRelation.isList;
            // get transformers
            var embeddedTransformerFactories = (embeddedTransformerNames === null || embeddedTransformerNames === void 0 ? void 0 : embeddedTransformerNames.map(function (name) { return foreignCrudService === null || foreignCrudService === void 0 ? void 0 : foreignCrudService.getTransformerByName(name); }).filter(array_1.notEmpty)) || [];
            var embeddedFields = embeddedFieldNames.map(function (name) {
                var field = foreignModel.fields.find(function (f) { return f.name === name; });
                if (!field) {
                    throw new Error("Could not find field ".concat(name, " on ").concat(foreignModel.name));
                }
                if (field.type !== 'scalar') {
                    throw new Error("Field ".concat(name, " on ").concat(foreignModel.name, " is not a scalar"));
                }
                return field;
            });
            var dataInputName = "".concat(modelName, "Embedded").concat((0, case_1.upperCaseFirst)(localRelationName), "Data");
            var upsertTransformers = embeddedTransformerFactories.map(function (factory) {
                return factory.buildTransformer({ operationType: 'upsert' });
            });
            // If we use the existing item, we should check that its ID is actually owned
            // by the parent
            var getForeignRelationParentField = function () {
                var _a, _b;
                // figure out which field is parent ID
                var foreignParentIdx = (_a = foreignRelation.references) === null || _a === void 0 ? void 0 : _a.findIndex(function (reference) { return reference === localId; });
                // foreign parent ID is not in list
                if (foreignParentIdx == null || foreignParentIdx === -1) {
                    throw new Error("Foreign reference must contain primary key of local model");
                }
                var foreignParentField = (_b = foreignRelation.fields) === null || _b === void 0 ? void 0 : _b[foreignParentIdx];
                if (!foreignParentField) {
                    throw new Error("Unable to find foreign parent field");
                }
                return foreignParentField;
            };
            var dataMethodOptions = {
                modelName: foreignModel.name,
                prismaFieldNames: embeddedFields.map(function (f) { return f.name; }),
                operationName: 'create',
                transformers: upsertTransformers,
                prismaOutput: prismaOutput,
                isPartial: false,
                serviceContext: serviceContext,
                prismaUtils: prismaUtils,
                operationType: 'upsert',
                whereUniqueExpression: 'whereUnique',
                parentIdCheckField: upsertTransformers.some(function (t) { return t.needsExistingItem; })
                    ? getForeignRelationParentField()
                    : undefined
            };
            var upsertFunction = !embeddedTransformerFactories.length
                ? undefined
                : createEmbeddedTransformFunction({
                    name: "prepareUpsertEmbedded".concat((0, case_1.upperCaseFirst)(localRelationName), "Data"),
                    inputDataType: dataInputName,
                    outputDataType: "Prisma.".concat((0, case_1.upperCaseFirst)(foreignModel.name), "Upsert").concat(isOneToOne ? '' : 'WithWhereUnique', "Without").concat((0, case_1.upperCaseFirst)(foreignRelation.name), "Input"),
                    dataMethodOptions: dataMethodOptions,
                    isOneToOne: isOneToOne,
                    prismaUtils: prismaUtils,
                    serviceContextType: serviceContext.getServiceContextType(),
                    whereUniqueType: "Prisma.".concat((0, case_1.upperCaseFirst)(foreignModel.name), "WhereUniqueInput")
                });
            var dataInputType = (0, data_method_1.getDataInputTypeBlock)(dataInputName, dataMethodOptions).withHeaderKey(dataInputName);
            var dataMethodDataType = (0, data_method_1.getDataMethodDataType)(dataMethodOptions);
            var isNullable = !localRelation.isList && operationType === 'update';
            var inputField = {
                type: core_generators_1.TypescriptCodeUtils.createExpression("".concat(dataInputName).concat(localRelation.isList ? '[]' : '').concat(isNullable ? ' | null' : ''), undefined, {
                    headerBlocks: [dataInputType]
                }),
                dtoField: {
                    name: inputName,
                    isOptional: true,
                    isNullable: isNullable,
                    type: 'nested',
                    isList: localRelation.isList,
                    nestedType: {
                        name: dataInputName,
                        fields: dataMethodDataType.fields
                    }
                }
            };
            /**
             * This is a fairly complex piece of logic. We have the following scenarios:
             *
             * Update/Create:
             *  - Update operation
             *  - Create operation
             *
             * Relationship Type:
             *  - 1:many relationship
             *  - 1:1 relationship
             *
             * Data Preprocessing:
             *  - May have transform function
             *  - May have no transform function
             */
            var embeddedCallName = "createOneTo".concat(isOneToOne ? 'One' : 'Many').concat(operationType === 'create' ? 'Create' : 'Upsert', "Data");
            var embeddedCallImport = "%prisma-utils/embeddedOneTo".concat(isOneToOne ? 'One' : 'Many');
            var embeddedCallExpression = core_generators_1.TypescriptCodeUtils.createExpression(embeddedCallName, "import { ".concat(embeddedCallName, " } from '").concat(embeddedCallImport, "'"), { importMappers: [prismaUtils] });
            // finds the discriminator ID field in the input for 1:many relationships
            var getDiscriminatorIdField = function () {
                var foreignIds = (foreignModel === null || foreignModel === void 0 ? void 0 : foreignModel.idFields) || [];
                var discriminatorIdFields = foreignIds.filter(function (foreignId) {
                    return embeddedFieldNames.includes(foreignId);
                });
                if (discriminatorIdFields.length !== 1) {
                    throw new Error("Expected 1 discriminator ID field for ".concat(localRelationName, ", found ").concat(discriminatorIdFields.length));
                }
                return discriminatorIdFields[0];
            };
            var getWhereUniqueFunction = function () {
                var _a;
                var returnType = core_generators_1.TypescriptCodeUtils.createExpression("Prisma.".concat((0, case_1.upperCaseFirst)(foreignModel.name), "WhereUniqueInput | undefined"), "import { Prisma } from '@prisma/client'");
                // convert primary keys to where unique
                var foreignIds = (foreignModel === null || foreignModel === void 0 ? void 0 : foreignModel.idFields) || [];
                var primaryKeyFields = foreignIds.map(function (idField) {
                    var _a, _b;
                    // check if ID field is in relation
                    var idRelationIdx = (_a = foreignRelation.fields) === null || _a === void 0 ? void 0 : _a.findIndex(function (relationField) { return relationField === idField; });
                    if (idRelationIdx != null && idRelationIdx !== -1) {
                        var localField = (_b = foreignRelation.references) === null || _b === void 0 ? void 0 : _b[idRelationIdx];
                        if (!localField) {
                            throw new Error("Could not find corresponding relation field for ".concat(idField));
                        }
                        // short-circuit case for updates
                        if (operationType === 'update' && localId === localField) {
                            return { name: idField, value: localId };
                        }
                        return {
                            name: idField,
                            value: "existingItem.".concat(localField),
                            needsExistingItem: true
                        };
                    }
                    // check if ID field is in input
                    var embeddedField = embeddedFields.find(function (f) { return f.name === idField; });
                    if (embeddedField) {
                        return {
                            name: idField,
                            value: "input.".concat(idField),
                            usesInput: true,
                            requiredInputField: embeddedField.isOptional || embeddedField.hasDefault
                                ? idField
                                : undefined
                        };
                    }
                    throw new Error("Could not find ID field ".concat(idField, " in either embedded object or relation for relation ").concat(localRelationName, " of ").concat(modelName));
                });
                var primaryKeyExpression = core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].fromPairs(primaryKeyFields.map(function (keyField) { return [
                    keyField.name,
                    keyField.value,
                ]; })), { wrapWithParenthesis: true });
                var value = primaryKeyFields.length > 1
                    ? core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject((_a = {},
                        _a[foreignIds.join('_')] = primaryKeyExpression,
                        _a), { wrapWithParenthesis: true })
                    : primaryKeyExpression;
                var usesInput = primaryKeyFields.some(function (k) { return k.usesInput; });
                var needsExistingItem = primaryKeyFields.some(function (k) { return k.needsExistingItem; });
                var requirementsList = __spreadArray(__spreadArray([], (needsExistingItem && operationType === 'upsert'
                    ? ['!existingItem']
                    : []), true), primaryKeyFields
                    .map(function (f) { return f.requiredInputField && "!input.".concat(f.requiredInputField); })
                    .filter(array_1.notEmpty), true);
                return {
                    func: core_generators_1.TypescriptCodeUtils.formatExpression("(INPUT): RETURN_TYPE => VALUE", {
                        INPUT: usesInput ? 'input' : '',
                        RETURN_TYPE: returnType,
                        PREFIX: '',
                        VALUE: requirementsList.length
                            ? value.prepend("".concat(requirementsList.join(' || '), " ? undefined : "))
                            : value
                    }),
                    needsExistingItem: needsExistingItem
                };
            };
            var embeddedCallArgs = (function () {
                var _a;
                if (operationType === 'create') {
                    return {
                        args: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject({
                            input: inputName,
                            transform: upsertFunction === null || upsertFunction === void 0 ? void 0 : upsertFunction.name,
                            context: upsertFunction && 'context'
                        })
                    };
                }
                var whereUniqueResult = getWhereUniqueFunction();
                var parentId = operationType === 'update' ? localId : "existingItem.".concat(localId);
                var transformAdditions = !upsertFunction
                    ? {}
                    : {
                        transform: upsertFunction.name,
                        context: 'context',
                        getWhereUnique: whereUniqueResult.func,
                        parentId: parentId
                    };
                var oneToManyAdditions = isOneToOne
                    ? {}
                    : {
                        idField: (0, core_generators_1.quot)(getDiscriminatorIdField()),
                        getWhereUnique: whereUniqueResult.func
                    };
                var parentField = getForeignRelationParentField();
                var oneToOneAdditions = !isOneToOne
                    ? {}
                    : {
                        deleteRelation: core_generators_1.TypescriptCodeUtils.formatExpression('() => PRISMA_MODEL.deleteMany({ where: WHERE_ARGS })', {
                            PRISMA_MODEL: prismaOutput.getPrismaModelExpression(foreignModel.name),
                            WHERE_ARGS: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject((_a = {},
                                _a[parentField] = parentId,
                                _a))
                        })
                    };
                return {
                    args: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(__assign(__assign(__assign({ input: inputName }, transformAdditions), oneToManyAdditions), oneToOneAdditions)),
                    needsExistingItem: whereUniqueResult.needsExistingItem ||
                        (operationType === 'upsert' && !!upsertFunction)
                };
            })();
            var outputName = "".concat(localRelationName, "Output");
            var transformer = core_generators_1.TypescriptCodeUtils.formatBlock("const OUTPUT_NAME = await EMBEDDED_CALL(ARGS)", {
                OUTPUT_NAME: outputName,
                EMBEDDED_CALL: embeddedCallExpression,
                ARGS: embeddedCallArgs.args
            }, { headerBlocks: upsertFunction ? [upsertFunction.func] : [] });
            return {
                inputFields: [inputField],
                outputFields: [
                    {
                        name: localRelationName,
                        pipeOutputName: outputName,
                        transformer: transformer,
                        createExpression: "{ create: ".concat(outputName, ".data?.create }")
                    },
                ],
                needsExistingItem: embeddedCallArgs.needsExistingItem,
                isAsync: true,
                needsContext: !!upsertFunction
            };
        }
        prismaCrudServiceSetup.addTransformer(localRelationName, {
            buildTransformer: buildTransformer
        });
        return {
            build: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); }
        };
    }
});
exports["default"] = EmbeddedRelationTransformerGenerator;
