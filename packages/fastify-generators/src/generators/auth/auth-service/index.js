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
exports.authInfoImportProvider = exports.authInfoProvider = exports.authServiceImportProvider = exports.authServiceProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var config_service_1 = require("@src/generators/core/config-service");
var error_handler_service_1 = require("@src/generators/core/error-handler-service");
var root_module_1 = require("@src/generators/core/root-module");
var prisma_1 = require("@src/generators/prisma/prisma");
var array_1 = require("@src/utils/array");
var string_1 = require("@src/utils/string");
var auth_1 = require("../auth");
var descriptorSchema = zod_1.z.object({
    accessTokenExpiry: zod_1.z.string()["default"]('1h'),
    refreshTokenExpiry: zod_1.z.string()["default"]('30d'),
    userModelName: zod_1.z.string().min(1),
    userModelIdField: zod_1.z.string()["default"]('id')
});
exports.authServiceProvider = (0, sync_1.createProviderType)('auth-service');
exports.authServiceImportProvider = (0, sync_1.createProviderType)('auth-service-import', {
    isReadOnly: true
});
exports.authInfoProvider = (0, sync_1.createProviderType)('auth-info');
exports.authInfoImportProvider = (0, sync_1.createProviderType)('auth-info-import', {
    isReadOnly: true
});
var AuthServiceGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, _a) {
        var accessTokenExpiry = _a.accessTokenExpiry, refreshTokenExpiry = _a.refreshTokenExpiry, userModelName = _a.userModelName, userModelIdField = _a.userModelIdField;
        var authInfoTask = taskBuilder.addTask({
            name: 'authInfo',
            dependencies: {
                node: core_generators_1.nodeProvider,
                appModule: root_module_1.appModuleProvider,
                typescript: core_generators_1.typescriptProvider,
                errorHandler: error_handler_service_1.errorHandlerServiceProvider
            },
            exports: {
                authInfo: exports.authInfoProvider,
                authInfoImport: exports.authInfoImportProvider
            },
            run: function (_a) {
                var _this = this;
                var appModule = _a.appModule, typescript = _a.typescript, errorHandler = _a.errorHandler, node = _a.node;
                node.addPackages({ '@fastify/request-context': '4.0.0' });
                var authFields = (0, sync_1.createNonOverwriteableMap)({
                    user: {
                        key: 'user',
                        value: new core_generators_1.TypescriptCodeExpression('user'),
                        type: core_generators_1.TypescriptCodeUtils.createExpression('UserInfo | null')
                    },
                    requiredUser: {
                        key: 'requiredUser',
                        value: core_generators_1.TypescriptCodeUtils.createExpression("\n() => {\n  if (!user) {\n    throw new UnauthorizedError('User is required');\n  }\n  return user;\n}\n", "import { UnauthorizedError } from '%http-errors';", { importMappers: [errorHandler] }),
                        type: core_generators_1.TypescriptCodeUtils.createExpression('() => UserInfo')
                    }
                }, { name: 'auth-field' });
                var getImportMap = function () { return ({
                    '%auth-info': {
                        path: "@/".concat(appModule.getModuleFolder(), "/utils/auth-info"),
                        allowedImports: ['UserInfo', 'AuthInfo', 'createAuthInfoFromUser']
                    }
                }); };
                return {
                    getProviders: function () { return ({
                        authInfo: {
                            registerAuthField: function (field) {
                                authFields.set(field.key, field);
                            },
                            getImportMap: getImportMap
                        },
                        authInfoImport: { getImportMap: getImportMap }
                    }); },
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        var authMap, authValues, authInfoFile;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    builder.setBaseDirectory(appModule.getModuleFolder());
                                    authMap = authFields.value();
                                    authValues = Object.values(authMap);
                                    authInfoFile = typescript.createTemplate({
                                        EXTRA_ARGS: core_generators_1.TypescriptCodeUtils.mergeExpressions(authValues
                                            .flatMap(function (v) { return v.extraCreateArgs || []; })
                                            .map(function (arg) {
                                            return arg.type.wrap(function (type) { return "".concat(arg.name, ": ").concat(type); });
                                        }), ', '),
                                        AUTH_TYPE: core_generators_1.TypescriptCodeUtils.mergeBlocksAsInterfaceContent(ramda_1["default"].mapObjIndexed(function (value) { return value.type; }, authMap)),
                                        AUTH_OBJECT: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].mapObjIndexed(function (value) { return value.value; }, authMap))
                                    });
                                    return [4 /*yield*/, builder.apply(authInfoFile.renderToAction('utils/auth-info.ts'))];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/, { authValues: authValues }];
                            }
                        });
                    }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'main',
            dependencies: {
                appModule: root_module_1.appModuleProvider,
                node: core_generators_1.nodeProvider,
                errorHandlerService: error_handler_service_1.errorHandlerServiceProvider,
                prismaOutput: prisma_1.prismaOutputProvider,
                typescript: core_generators_1.typescriptProvider,
                config: config_service_1.configServiceProvider,
                authSetup: auth_1.authSetupProvider
            },
            exports: {
                authService: exports.authServiceProvider,
                authServiceImport: exports.authServiceImportProvider
            },
            taskDependencies: { authInfo: authInfoTask },
            run: function (_a, _b) {
                var _this = this;
                var appModule = _a.appModule, node = _a.node, errorHandlerService = _a.errorHandlerService, prismaOutput = _a.prismaOutput, typescript = _a.typescript, config = _a.config, authSetup = _a.authSetup;
                var authValues = _b.authInfo.authValues;
                var modulePath = appModule.getModuleFolder();
                node.addPackages({
                    jsonwebtoken: '^8.5.1',
                    ms: '^2.1.3'
                });
                node.addDevPackages({
                    '@types/jsonwebtoken': '^8.5.8',
                    '@types/ms': '^0.7.31'
                });
                var authServiceFile = typescript.createTemplate({
                    USER_TYPE: { type: 'code-expression' },
                    ACCESS_TOKEN_EXPIRY_TIME: { type: 'code-expression' },
                    REFRESH_TOKEN_EXPIRY_TIME: { type: 'code-expression' },
                    USER_MODEL: { type: 'code-expression' },
                    USER_ID_NAME: { type: 'code-expression' },
                    AUTH_USER: { type: 'code-expression' },
                    AUTH_USER_QUERY_PARMS: { type: 'code-expression' },
                    EXTRA_ARGS: core_generators_1.TypescriptCodeUtils.mergeExpressions(authValues
                        .flatMap(function (v) { return v.extraCreateArgs || []; })
                        .map(function (arg) { return arg.name; }), ', '),
                    AUTH_INFO_CREATOR: core_generators_1.TypescriptCodeUtils.mergeBlocks(authValues.map(function (field) { return field.creatorBody; }).filter(array_1.notEmpty))
                });
                authServiceFile.addCodeEntries({
                    ACCESS_TOKEN_EXPIRY_TIME: (0, string_1.quot)(accessTokenExpiry),
                    REFRESH_TOKEN_EXPIRY_TIME: (0, string_1.quot)(refreshTokenExpiry),
                    USER_MODEL: prismaOutput.getPrismaModelExpression(userModelName),
                    USER_ID_NAME: userModelIdField
                });
                config.getConfigEntries().set('JWT_SECRET', {
                    value: new core_generators_1.TypescriptCodeExpression('z.string()'),
                    comment: "The secret used to sign JWT's",
                    seedValue: 'MyJwtSecretKey',
                    exampleValue: 'MyJwtSecretKey'
                });
                authSetup.getConfig().set('userModelName', userModelName);
                var authServiceImport = (0, core_generators_1.makeImportAndFilePath)("".concat(modulePath, "/services/auth-service"))[0];
                var importMap = {
                    '%auth-service': {
                        path: authServiceImport,
                        allowedImports: [
                            'AuthPayload',
                            'loginUser',
                            'renewToken',
                            'getUserInfoFromAuthorization',
                            'createAuthInfoFromAuthorization',
                            'ACCESS_TOKEN_EXPIRY_SECONDS',
                            'REFRESH_TOKEN_EXPIRY_SECONDS',
                        ]
                    },
                    '%jwt-service': {
                        path: "@/".concat(modulePath, "/services/jwt-service"),
                        allowedImports: ['jwtService', 'InvalidTokenError']
                    }
                };
                return {
                    getProviders: function () { return ({
                        authService: {
                            getServiceExpression: function () {
                                return new core_generators_1.TypescriptCodeExpression('authService', "import { authService } from '".concat(authServiceImport, "'"));
                            },
                            getImportMap: function () { return importMap; }
                        },
                        authServiceImport: {
                            getImportMap: function () { return importMap; },
                            getAuthInfoCreator: function (request, token) {
                                return token.wrap(function (t) { return "await createAuthInfoFromAuthorization(".concat(t, ")"); }, "import { createAuthInfoFromAuthorization } from '".concat(authServiceImport, "'"));
                            }
                        }
                    }); },
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    builder.setBaseDirectory(modulePath);
                                    return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                            source: 'services/jwt-service.ts',
                                            importMappers: [errorHandlerService, config]
                                        }))];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, builder.apply(authServiceFile.renderToAction('services/auth-service.ts'))];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }
                };
            }
        });
    }
});
exports["default"] = AuthServiceGenerator;
