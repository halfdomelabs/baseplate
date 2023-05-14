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
exports.storageModuleProvider = void 0;
var path_1 = require("path");
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var config_service_1 = require("@src/generators/core/config-service");
var error_handler_service_1 = require("@src/generators/core/error-handler-service");
var root_module_1 = require("@src/generators/core/root-module");
var service_context_1 = require("@src/generators/core/service-context");
var pothos_1 = require("@src/generators/pothos/pothos");
var prisma_1 = require("@src/generators/prisma/prisma");
var prisma_utils_1 = require("@src/generators/prisma/prisma-utils");
var pothos_type_1 = require("@src/providers/pothos-type");
var descriptorSchema = zod_1.z.object({
    fileModel: zod_1.z.string().min(1),
    fileObjectTypeRef: zod_1.z.string().min(1),
    s3Adapters: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        bucketConfigVar: zod_1.z.string().min(1),
        hostedUrlConfigVar: zod_1.z.string().optional()
    })),
    categories: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        defaultAdapter: zod_1.z.string().min(1),
        maxFileSize: zod_1.z.number(),
        usedByRelation: zod_1.z.string().min(1),
        uploadRoles: zod_1.z.array(zod_1.z.string().min(1))
    }))
});
exports.storageModuleProvider = (0, sync_1.createProviderType)('storage-module', { isReadOnly: true });
var StorageModuleGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, _a) {
        var fileModel = _a.fileModel, s3Adapters = _a.s3Adapters, _b = _a.categories, categories = _b === void 0 ? [] : _b, fileObjectTypeRef = _a.fileObjectTypeRef;
        taskBuilder.addTask({
            name: 'setup-file-input-schema',
            dependencies: {
                appModule: root_module_1.appModuleProvider,
                pothosSetup: pothos_1.pothosSetupProvider
            },
            run: function (_a) {
                var pothosSetup = _a.pothosSetup, appModule = _a.appModule;
                var moduleFolder = appModule.getModuleFolder();
                pothosSetup.getTypeReferences().addInputType({
                    typeName: 'FileUploadInput',
                    exportName: 'fileUploadInputInputType',
                    moduleName: "@/".concat(path_1["default"].join(moduleFolder, 'schema/file-upload.input-type'))
                });
                return {};
            }
        });
        taskBuilder.addTask({
            name: 'main',
            dependencies: {
                appModule: root_module_1.appModuleProvider
            },
            exports: { storageModule: exports.storageModuleProvider },
            run: function (_a) {
                var appModule = _a.appModule;
                var moduleFolder = appModule.getModuleFolder();
                var validatorImport = (0, core_generators_1.makeImportAndFilePath)("".concat(moduleFolder, "/services/validate-upload-input.ts"))[0];
                var adaptersImport = (0, core_generators_1.makeImportAndFilePath)("".concat(moduleFolder, "/constants/adapters.ts"))[0];
                return {
                    getProviders: function () { return ({
                        storageModule: {
                            getImportMap: function () {
                                return {
                                    '%storage-module/validate-upload-input': {
                                        path: validatorImport,
                                        allowedImports: [
                                            'FileUploadInput',
                                            'validateFileUploadInput',
                                        ]
                                    },
                                    '%storage-module/adapter-constants': {
                                        path: adaptersImport,
                                        allowedImports: ['STORAGE_ADAPTERS', 'StorageAdapterKey']
                                    }
                                };
                            }
                        }
                    }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'build',
            dependencies: {
                node: core_generators_1.nodeProvider,
                typescript: core_generators_1.typescriptProvider,
                pothosSchema: pothos_1.pothosSchemaProvider,
                appModule: root_module_1.appModuleProvider,
                serviceContext: service_context_1.serviceContextProvider,
                errorHandlerService: error_handler_service_1.errorHandlerServiceProvider,
                prismaOutput: prisma_1.prismaOutputProvider,
                configService: config_service_1.configServiceProvider,
                prismaUtils: prisma_utils_1.prismaUtilsProvider,
                fileObjectType: pothos_type_1.pothosTypeOutputProvider
                    .dependency()
                    .reference(fileObjectTypeRef)
            },
            run: function (_a) {
                var _this = this;
                var node = _a.node, typescript = _a.typescript, appModule = _a.appModule, pothosSchema = _a.pothosSchema, serviceContext = _a.serviceContext, errorHandlerService = _a.errorHandlerService, prismaOutput = _a.prismaOutput, configService = _a.configService, prismaUtils = _a.prismaUtils, fileObjectType = _a.fileObjectType;
                var moduleFolder = appModule.getModuleFolder();
                var _b = (0, core_generators_1.makeImportAndFilePath)("".concat(moduleFolder, "/services/validate-upload-input.ts")), validatorPath = _b[1];
                node.addPackages({
                    '@aws-sdk/client-s3': '3.121.0',
                    '@aws-sdk/s3-presigned-post': '3.121.0',
                    '@aws-sdk/s3-request-presigner': '3.121.0',
                    'mime-types': '2.1.35'
                });
                node.addDevPackages({
                    '@types/mime-types': '2.1.1'
                });
                configService
                    .getConfigEntries()
                    .set('AWS_ACCESS_KEY_ID', {
                    comment: 'AWS access key ID',
                    value: new core_generators_1.TypescriptCodeExpression('z.string().min(1)'),
                    seedValue: 'AWS_ACCESS_KEY'
                })
                    .set('AWS_SECRET_ACCESS_KEY', {
                    comment: 'AWS secret access key',
                    value: new core_generators_1.TypescriptCodeExpression('z.string().min(1)'),
                    seedValue: 'AWS_SECRET_ACCSS_KEY'
                })
                    .set('AWS_DEFAULT_REGION', {
                    comment: 'AWS default region',
                    value: new core_generators_1.TypescriptCodeExpression('z.string().min(1)'),
                    seedValue: 'AWS_DEFAULT_REGION'
                });
                return {
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        // Copy schema
                        function registerSchemaFile(file) {
                            return __awaiter(this, void 0, void 0, function () {
                                var fileObjectRef;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            appModule.addModuleImport("@/".concat(moduleFolder, "/").concat(file));
                                            pothosSchema.registerSchemaFile(path_1["default"].join(moduleFolder, "".concat(file, ".ts")));
                                            fileObjectRef = fileObjectType.getTypeReference();
                                            return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                                    source: "".concat(file, ".ts"),
                                                    destination: path_1["default"].join(moduleFolder, "".concat(file, ".ts")),
                                                    importMappers: [pothosSchema],
                                                    replacements: {
                                                        FILE_OBJECT_MODULE: fileObjectRef.moduleName,
                                                        FILE_OBJECT_TYPE: fileObjectRef.exportName
                                                    }
                                                }))];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        }
                        var model, modelType, createPresignedUploadUrlFile, createPresignedDownloadUrlFile, downloadFile, validateUploadInputFile, adapters, adaptersFile, categoriesList, categoriesFile;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: 
                                // Copy adapters
                                return [4 /*yield*/, builder.apply(typescript.createCopyFilesAction({
                                        destinationBaseDirectory: moduleFolder,
                                        paths: [
                                            'adapters/index.ts',
                                            'adapters/s3.ts',
                                            'adapters/url.ts',
                                            'adapters/types.ts',
                                        ]
                                    }))];
                                case 1:
                                    // Copy adapters
                                    _a.sent();
                                    return [4 /*yield*/, Promise.all([
                                            registerSchemaFile('schema/file-upload.input-type'),
                                            registerSchemaFile('schema/hosted-url.field'),
                                            registerSchemaFile('schema/presigned.mutations'),
                                        ])];
                                case 2:
                                    _a.sent();
                                    model = prismaOutput.getPrismaModelExpression(fileModel);
                                    modelType = prismaOutput.getModelTypeExpression(fileModel);
                                    createPresignedUploadUrlFile = typescript.createTemplate({ FILE_MODEL: model, FILE_MODEL_TYPE: modelType }, { importMappers: [errorHandlerService, serviceContext] });
                                    return [4 /*yield*/, builder.apply(createPresignedUploadUrlFile.renderToAction('services/create-presigned-upload-url.ts', path_1["default"].join(moduleFolder, 'services/create-presigned-upload-url.ts')))];
                                case 3:
                                    _a.sent();
                                    createPresignedDownloadUrlFile = typescript.createTemplate({ FILE_MODEL: model }, { importMappers: [errorHandlerService, serviceContext] });
                                    return [4 /*yield*/, builder.apply(createPresignedDownloadUrlFile.renderToAction('services/create-presigned-download-url.ts', path_1["default"].join(moduleFolder, 'services/create-presigned-download-url.ts')))];
                                case 4:
                                    _a.sent();
                                    downloadFile = typescript.createTemplate({ FILE_MODEL: model, FILE_MODEL_TYPE: modelType }, { importMappers: [errorHandlerService, serviceContext] });
                                    return [4 /*yield*/, builder.apply(downloadFile.renderToAction('services/download-file.ts', path_1["default"].join(moduleFolder, 'services/download-file.ts')))];
                                case 5:
                                    _a.sent();
                                    validateUploadInputFile = typescript.createTemplate({ FILE_MODEL: model }, {
                                        importMappers: [
                                            prismaUtils,
                                            errorHandlerService,
                                            serviceContext,
                                        ]
                                    });
                                    return [4 /*yield*/, builder.apply(validateUploadInputFile.renderToAction('services/validate-upload-input.ts', validatorPath))];
                                case 6:
                                    _a.sent();
                                    // Copy utils
                                    return [4 /*yield*/, builder.apply(typescript.createCopyFilesAction({
                                            destinationBaseDirectory: moduleFolder,
                                            paths: [
                                                'utils/mime.ts',
                                                'utils/mime.unit.test.ts',
                                                {
                                                    path: 'utils/upload.ts',
                                                    replacements: {
                                                        FILE_CREATE_INPUT: "".concat(fileModel, "CreateInput")
                                                    }
                                                },
                                            ],
                                            importMappers: [serviceContext, errorHandlerService]
                                        }))];
                                case 7:
                                    // Copy utils
                                    _a.sent();
                                    adapters = {};
                                    s3Adapters === null || s3Adapters === void 0 ? void 0 : s3Adapters.forEach(function (adapter) {
                                        configService.getConfigEntries().set(adapter.bucketConfigVar, {
                                            comment: "S3 bucket for ".concat(adapter.name),
                                            value: new core_generators_1.TypescriptCodeExpression('z.string().min(1)'),
                                            seedValue: adapter.bucketConfigVar
                                        });
                                        if (adapter.hostedUrlConfigVar) {
                                            configService
                                                .getConfigEntries()
                                                .set(adapter.hostedUrlConfigVar, {
                                                comment: "Hosted URL prefix for ".concat(adapter.name, ", e.g. https://uploads.example.com"),
                                                value: new core_generators_1.TypescriptCodeExpression('z.string().min(1)'),
                                                seedValue: adapter.hostedUrlConfigVar
                                            });
                                        }
                                        adapters[adapter.name] =
                                            core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject({
                                                bucket: "config.".concat(adapter.bucketConfigVar),
                                                region: "config.AWS_DEFAULT_REGION",
                                                hostedUrl: adapter.hostedUrlConfigVar
                                                    ? "config.".concat(adapter.hostedUrlConfigVar)
                                                    : undefined
                                            }).wrap(function (contents) { return "createS3Adapter(".concat(contents, ")"); }, [
                                                "import { createS3Adapter } from '../adapters';",
                                                "import { config } from '%config';",
                                            ]);
                                    });
                                    adaptersFile = typescript.createTemplate({
                                        ADAPTERS: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(adapters)
                                    }, {
                                        importMappers: [configService]
                                    });
                                    return [4 /*yield*/, builder.apply(adaptersFile.renderToAction('constants/adapters.ts', path_1["default"].join(moduleFolder, 'constants/adapters.ts')))];
                                case 8:
                                    _a.sent();
                                    categoriesList = categories.map(function (category) {
                                        var _a;
                                        return core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject({
                                            name: (0, core_generators_1.quot)(category.name),
                                            authorizeUpload: ((_a = category.uploadRoles) === null || _a === void 0 ? void 0 : _a.length)
                                                ? core_generators_1.TypescriptCodeUtils.mergeExpressionsAsArray(category.uploadRoles.map(core_generators_1.quot)).wrap(function (contents) {
                                                    return "({ auth }) => auth.hasSomeRole(".concat(contents, ")");
                                                })
                                                : undefined,
                                            defaultAdapter: (0, core_generators_1.quot)(category.defaultAdapter),
                                            maxFileSize: "".concat(category.maxFileSize, " * MEGABYTE"),
                                            usedByRelation: (0, core_generators_1.quot)(category.usedByRelation)
                                        });
                                    });
                                    categoriesFile = typescript.createTemplate({
                                        CATEGORIES: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsArray(categoriesList),
                                        FILE_COUNT_OUTPUT_TYPE: new core_generators_1.TypescriptStringReplacement("".concat(fileModel, "CountOutputType")),
                                        FILE_MODEL_TYPE: modelType
                                    }, { importMappers: [serviceContext] });
                                    return [4 /*yield*/, builder.apply(categoriesFile.renderToAction('constants/file-categories.ts', path_1["default"].join(moduleFolder, 'constants/file-categories.ts')))];
                                case 9:
                                    _a.sent();
                                    // awkward AWS hack (https://stackoverflow.com/questions/66275648/aws-javascript-sdk-v3-typescript-doesnt-compile-due-to-error-ts2304-cannot-f/66275649#66275649)
                                    // await builder.apply(
                                    //   typescript.createCopyAction({
                                    //     source: '@types/dom.ts',
                                    //     destination: 'src/@types/dom.ts',
                                    //   })
                                    // );
                                    adapters.url = core_generators_1.TypescriptCodeUtils.createExpression('createUrlAdapter()', "import { createS3Adapter } from '../adapters';");
                                    return [2 /*return*/];
                            }
                        });
                    }); }
                };
            }
        });
    }
});
exports["default"] = StorageModuleGenerator;
