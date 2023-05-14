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
exports.getDataMethodDataExpressions = exports.getDataInputTypeBlock = exports.getDataMethodDataType = exports.wrapWithApplyDataPipe = exports.getDataMethodContextRequired = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var ramda_1 = require("ramda");
var fieldTypes_1 = require("@src/types/fieldTypes");
var array_1 = require("@src/utils/array");
var case_1 = require("@src/utils/case");
function getDataMethodContextRequired(_a) {
    var transformers = _a.transformers;
    return transformers.some(function (t) { return t.needsContext; });
}
exports.getDataMethodContextRequired = getDataMethodContextRequired;
function wrapWithApplyDataPipe(operation, pipeNames, prismaUtils) {
    if (!pipeNames.length) {
        return operation;
    }
    return core_generators_1.TypescriptCodeUtils.formatExpression("applyDataPipeOutput(PIPE_NAMES, OPERATION)", {
        PIPE_NAMES: "[".concat(pipeNames.join(', '), "]"),
        OPERATION: operation
    }, {
        importText: [
            "import {applyDataPipeOutput} from '%prisma-utils/dataPipes'",
        ],
        importMappers: [prismaUtils]
    });
}
exports.wrapWithApplyDataPipe = wrapWithApplyDataPipe;
function getDataMethodDataType(_a) {
    var modelName = _a.modelName, prismaFieldNames = _a.prismaFieldNames, prismaOutput = _a.prismaOutput, operationName = _a.operationName, isPartial = _a.isPartial, transformers = _a.transformers;
    var prismaDefinition = prismaOutput.getPrismaModel(modelName);
    var prismaFields = prismaFieldNames.map(function (fieldName) {
        var field = prismaDefinition.fields.find(function (f) { return f.name === fieldName; });
        if (!field) {
            throw new Error("Could not find field ".concat(fieldName, " in model ").concat(modelName));
        }
        return field;
    });
    var transformerFields = transformers.flatMap(function (transformer) {
        return transformer.inputFields.map(function (f) { return f.dtoField; });
    });
    return {
        name: "".concat(modelName).concat((0, case_1.upperCaseFirst)(operationName), "Data"),
        fields: __spreadArray(__spreadArray([], prismaFields.map(function (field) {
            if (field.type !== 'scalar') {
                throw new Error("Non-scalar fields not suppported in data method operation");
            }
            return __assign({ type: 'scalar', name: field.name, isList: field.isList, scalarType: field.scalarType, enumType: field.enumType
                    ? prismaOutput.getServiceEnum(field.enumType)
                    : undefined }, (isPartial
                ? { isOptional: true, isNullable: field.isOptional }
                : {
                    isOptional: field.isOptional || field.hasDefault,
                    isNullable: field.isOptional
                }));
        }), true), transformerFields, true)
    };
}
exports.getDataMethodDataType = getDataMethodDataType;
function getDataInputTypeBlock(dataInputTypeName, _a) {
    var modelName = _a.modelName, prismaFieldNames = _a.prismaFieldNames, operationName = _a.operationName, transformers = _a.transformers;
    var prismaFieldSelection = prismaFieldNames
        .map(function (field) { return "'".concat(field, "'"); })
        .join(' | ');
    var transformerInputs = transformers.flatMap(function (transformer) { return transformer.inputFields; });
    if (!transformerInputs.length) {
        return core_generators_1.TypescriptCodeUtils.formatBlock("type DATA_INPUT_TYPE_NAME = Pick<Prisma.PRISMA_DATA_INPUT, PRISMA_FIELDS>;", {
            DATA_INPUT_TYPE_NAME: dataInputTypeName,
            PRISMA_DATA_INPUT: "".concat(modelName, "Unchecked").concat((0, case_1.upperCaseFirst)(operationName), "Input"),
            PRISMA_FIELDS: prismaFieldSelection
        }, { importText: ["import {Prisma} from '@prisma/client'"] });
    }
    var customFields = ramda_1["default"].mergeAll(transformers.flatMap(function (transformer) {
        return transformer.inputFields.map(function (f) {
            var _a;
            return (_a = {},
                _a["".concat(f.dtoField.name).concat(f.dtoField.isOptional ? '?' : '')] = f.type,
                _a);
        });
    }));
    return core_generators_1.TypescriptCodeUtils.formatBlock("interface DATA_INPUT_TYPE_NAME extends Pick<Prisma.PRISMA_DATA_INPUT, PRISMA_FIELDS> {\n  CUSTOM_FIELDS\n}", {
        DATA_INPUT_TYPE_NAME: dataInputTypeName,
        PRISMA_DATA_INPUT: "".concat(modelName, "Unchecked").concat((0, case_1.upperCaseFirst)(operationName), "Input"),
        PRISMA_FIELDS: prismaFieldSelection,
        CUSTOM_FIELDS: core_generators_1.TypescriptCodeUtils.mergeBlocksAsInterfaceContent(customFields)
    }, { importText: ["import {Prisma} from '@prisma/client'"] });
}
exports.getDataInputTypeBlock = getDataInputTypeBlock;
function getDataMethodDataExpressions(_a) {
    var transformers = _a.transformers, operationType = _a.operationType, whereUniqueExpression = _a.whereUniqueExpression, parentIdCheckField = _a.parentIdCheckField, prismaOutput = _a.prismaOutput, modelName = _a.modelName, prismaFieldNames = _a.prismaFieldNames, prismaUtils = _a.prismaUtils;
    if (!transformers.length) {
        return {
            functionBody: '',
            createExpression: core_generators_1.TypescriptCodeUtils.createExpression('data'),
            updateExpression: core_generators_1.TypescriptCodeUtils.createExpression('data'),
            dataPipeNames: []
        };
    }
    // if there are transformers, try to use the CheckedDataInput instead of Unchecked to allow nested creations
    var outputModel = prismaOutput.getPrismaModel(modelName);
    var relationFields = outputModel.fields.filter(function (field) {
        var _a;
        return field.type === 'relation' &&
            !!field.fields &&
            ((_a = field.fields) === null || _a === void 0 ? void 0 : _a.some(function (relationScalarField) {
                return prismaFieldNames.includes(relationScalarField);
            }));
    });
    var relationTransformers = relationFields.map(function (field) {
        var relationScalarFields = field.fields || [];
        var missingFields = relationScalarFields.filter(function (f) { return !prismaFieldNames.includes(f); });
        if (missingFields.length) {
            throw new Error("Relation named ".concat(field.name, " requires all fields as inputs (missing ").concat(missingFields.join(', '), ")"));
        }
        // create pseudo-transformer for relation fields
        var transformerPrefix = operationType === 'update' || field.isOptional
            ? "".concat(relationScalarFields
                .map(function (f) { return "".concat(f, " == null"); })
                .join(' || '), " ? ").concat(operationType === 'create'
                ? 'undefined'
                : relationScalarFields.join(' && '), " : ")
            : '';
        var foreignModel = prismaOutput.getPrismaModel(field.modelType);
        var foreignIdFields = foreignModel.idFields;
        if (!(foreignIdFields === null || foreignIdFields === void 0 ? void 0 : foreignIdFields.length)) {
            throw new Error("Foreign model has to have primary key");
        }
        var uniqueWhereValue = core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].fromPairs(foreignIdFields.map(function (idField) {
            var _a;
            var idx = (_a = field.references) === null || _a === void 0 ? void 0 : _a.findIndex(function (refName) { return refName === idField; });
            if (idx == null || idx === -1) {
                throw new Error("Relation ".concat(field.name, " must have a reference to the primary key of ").concat(field.modelType));
            }
            var localField = relationScalarFields[idx];
            // slightly awkward cast since update data might not be just a string
            var localFieldScalarType = (0, fieldTypes_1.getScalarFieldTypeInfo)(outputModel.fields.find(function (f) { return f.name === localField; }).scalarType);
            var castSuffix = operationType === 'update'
                ? " as ".concat(localFieldScalarType.typescriptType)
                : '';
            return [idField, "".concat(localField).concat(castSuffix)];
        })));
        var uniqueWhere = foreignIdFields.length > 1
            ? uniqueWhereValue.wrap(function (contents) { return "{ ".concat(foreignIdFields.join('_'), ": ").concat(contents, "}"); })
            : uniqueWhereValue;
        var transformer = core_generators_1.TypescriptCodeUtils.formatBlock('const FIELD_NAME = TRANSFORMER_PREFIX { connect: UNIQUE_WHERE }', {
            FIELD_NAME: field.name,
            TRANSFORMER_PREFIX: transformerPrefix,
            UNIQUE_WHERE: uniqueWhere
        });
        return {
            inputFields: relationScalarFields.map(function (f) { return ({
                type: core_generators_1.TypescriptCodeUtils.createExpression(''),
                dtoField: { name: f, type: 'scalar', scalarType: 'string' }
            }); }) || [],
            outputFields: [
                {
                    name: field.name,
                    transformer: transformer,
                    createExpression: operationType === 'upsert'
                        ? "".concat(field.name, " || undefined")
                        : undefined,
                    updateExpression: field.isOptional
                        ? core_generators_1.TypescriptCodeUtils.createExpression("createPrismaDisconnectOrConnectData(".concat(field.name, ")"), 'import {createPrismaDisconnectOrConnectData} from "%prisma-utils/prismaRelations"', { importMappers: [prismaUtils] })
                        : undefined
                },
            ],
            isAsync: false
        };
    });
    var augmentedTransformers = __spreadArray(__spreadArray([], transformers, true), relationTransformers, true);
    var customInputs = augmentedTransformers.flatMap(function (t) {
        return t.inputFields.map(function (f) { return f.dtoField.name; });
    });
    var needsExistingItem = operationType !== 'create' &&
        augmentedTransformers.some(function (t) { return t.needsExistingItem; });
    var existingItemGetter = !needsExistingItem
        ? core_generators_1.TypescriptCodeUtils.createBlock('')
        : core_generators_1.TypescriptCodeUtils.formatBlock("\nconst existingItem = OPTIONAL_WHERE\n(await PRISMA_MODEL.findUniqueOrThrow({ where: WHERE_UNIQUE }))\n", {
            OPTIONAL_WHERE: 
            // TODO: Make it a bit more flexible
            operationType === 'upsert' && whereUniqueExpression
                ? "".concat(whereUniqueExpression, " && ")
                : '',
            PRISMA_MODEL: prismaOutput.getPrismaModelExpression(modelName),
            WHERE_UNIQUE: whereUniqueExpression || ''
        });
    var parentIdCheck = parentIdCheckField &&
        "\n    if (existingItem && existingItem.".concat(parentIdCheckField, " !== parentId) {\n      throw new Error('").concat(modelName, " not attached to the correct parent item');\n    }\n    ");
    var functionBody = core_generators_1.TypescriptCodeUtils.formatBlock("const { CUSTOM_INPUTS, ...rest } = data;\n\n    EXISTING_ITEM_GETTER\n\n    PARENT_ID_CHECK\n     \nTRANSFORMERS", {
        CUSTOM_INPUTS: customInputs.join(', '),
        EXISTING_ITEM_GETTER: existingItemGetter,
        PARENT_ID_CHECK: parentIdCheck !== null && parentIdCheck !== void 0 ? parentIdCheck : '',
        TRANSFORMERS: core_generators_1.TypescriptCodeUtils.mergeBlocks(augmentedTransformers
            .flatMap(function (t) { return t.outputFields.map(function (f) { return f.transformer; }); })
            .filter(array_1.notEmpty), '\n\n')
    });
    function createExpressionEntries(expressionExtractor) {
        var dataExpressionEntries = __spreadArray(__spreadArray([], augmentedTransformers.flatMap(function (t) {
            return t.outputFields.map(function (f) { return [
                f.name,
                expressionExtractor(f) ||
                    (f.pipeOutputName ? "".concat(f.pipeOutputName, ".data") : f.name),
            ]; });
        }), true), [
            ['...', 'rest'],
        ], false);
        return core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].fromPairs(dataExpressionEntries));
    }
    var createExpression = createExpressionEntries(function (f) { return f.createExpression; });
    var updateExpression = createExpressionEntries(function (f) { return f.updateExpression; });
    return {
        functionBody: functionBody,
        createExpression: createExpression,
        updateExpression: updateExpression,
        dataPipeNames: transformers.flatMap(function (t) {
            return t.outputFields.map(function (f) { return f.pipeOutputName; }).filter(array_1.notEmpty);
        })
    };
}
exports.getDataMethodDataExpressions = getDataMethodDataExpressions;
