"use strict";
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
exports.__esModule = true;
exports.prismaFileTransformerProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var prisma_1 = require("@src/generators/prisma/prisma");
var prisma_crud_service_1 = require("@src/generators/prisma/prisma-crud-service");
var prisma_utils_1 = require("@src/generators/prisma/prisma-utils");
var storage_module_1 = require("../storage-module");
var descriptorSchema = zod_1.z.object({
    name: zod_1.z.string(),
    category: zod_1.z.string()
});
exports.prismaFileTransformerProvider = (0, sync_1.createProviderType)('prisma-file-transformer');
var PrismaFileTransformerGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        prismaCrudServiceSetup: prisma_crud_service_1.prismaCrudServiceSetupProvider,
        storageModule: storage_module_1.storageModuleProvider,
        prismaOutput: prisma_1.prismaOutputProvider,
        prismaUtils: prisma_utils_1.prismaUtilsProvider
    },
    exports: {
        prismaFileTransformer: exports.prismaFileTransformerProvider
    },
    createGenerator: function (_a, _b) {
        var _this = this;
        var _c;
        var name = _a.name, category = _a.category;
        var prismaOutput = _b.prismaOutput, prismaCrudServiceSetup = _b.prismaCrudServiceSetup, storageModule = _b.storageModule, prismaUtils = _b.prismaUtils;
        var modelName = prismaCrudServiceSetup.getModelName();
        var model = prismaOutput.getPrismaModel(modelName);
        var foreignRelation = model.fields.find(function (f) {
            return f.type === 'relation' && f.name === name;
        });
        if (!foreignRelation) {
            throw new Error("Could not find relation ".concat(name, " in model ").concat(modelName));
        }
        if (((_c = foreignRelation.fields) === null || _c === void 0 ? void 0 : _c.length) !== 1) {
            throw new Error("Foreign relation for file transformer must only have one field in model ".concat(modelName));
        }
        var foreignRelationFieldName = foreignRelation.fields[0];
        prismaCrudServiceSetup.addTransformer(name, {
            buildTransformer: function (_a) {
                var operationType = _a.operationType;
                var isFieldOptional = operationType === 'update' || foreignRelation.isOptional;
                var transformer = core_generators_1.TypescriptCodeUtils.createExpression("await validateFileUploadInput(".concat(name, ", ").concat((0, core_generators_1.quot)(category), ", context").concat(operationType !== 'create'
                    ? ", existingItem".concat(operationType === 'upsert' ? '?' : '', ".").concat(foreignRelationFieldName)
                    : '', ")"), 'import {validateFileUploadInput} from "%storage-module/validate-upload-input";', { importMappers: [storageModule] });
                var prefix = isFieldOptional ? "".concat(name, " == null ? ").concat(name, " : ") : '';
                return {
                    inputFields: [
                        {
                            type: core_generators_1.TypescriptCodeUtils.createExpression("FileUploadInput".concat(foreignRelation.isOptional ? '| null' : ''), 'import {FileUploadInput} from "%storage-module/validate-upload-input";', { importMappers: [storageModule] }),
                            dtoField: {
                                name: name,
                                type: 'nested',
                                isOptional: isFieldOptional,
                                isNullable: foreignRelation.isOptional,
                                schemaFieldName: 'FileUploadInput',
                                nestedType: {
                                    name: 'FileUploadInput',
                                    fields: [
                                        { type: 'scalar', scalarType: 'string', name: 'id' },
                                    ]
                                }
                            }
                        },
                    ],
                    outputFields: [
                        {
                            name: name,
                            transformer: transformer
                                .prepend("const ".concat(name, "Output = ").concat(prefix))
                                .toBlock(),
                            pipeOutputName: "".concat(name, "Output"),
                            createExpression: isFieldOptional
                                ? "".concat(name, "Output?.data")
                                : undefined,
                            updateExpression: foreignRelation.isOptional
                                ? core_generators_1.TypescriptCodeUtils.createExpression("createPrismaDisconnectOrConnectData(".concat(name, "Output && ").concat(name, "Output.data)"), "import {createPrismaDisconnectOrConnectData} from \"%prisma-utils/prismaRelations\";", { importMappers: [prismaUtils] })
                                : "".concat(name, "Output?.data")
                        },
                    ],
                    isAsync: true,
                    needsExistingItem: true,
                    needsContext: true
                };
            }
        });
        return {
            getProviders: function () { return ({
                prismaFileTransformer: {}
            }); },
            build: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); }
        };
    }
});
exports["default"] = PrismaFileTransformerGenerator;
