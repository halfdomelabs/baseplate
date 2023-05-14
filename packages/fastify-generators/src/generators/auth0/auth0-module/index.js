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
exports.auth0ModuleProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var auth_service_1 = require("@src/generators/auth/auth-service");
var role_service_1 = require("@src/generators/auth/role-service");
var config_service_1 = require("@src/generators/core/config-service");
var error_handler_service_1 = require("@src/generators/core/error-handler-service");
var root_module_1 = require("@src/generators/core/root-module");
var prisma_1 = require("@src/generators/prisma/prisma");
var descriptorSchema = zod_1.z.object({
    userModelName: zod_1.z.string().min(1),
    includeManagement: zod_1.z.boolean().optional()
});
exports.auth0ModuleProvider = (0, sync_1.createProviderType)('auth0-module');
var Auth0ModuleGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        typescript: core_generators_1.typescriptProvider,
        roleService: role_service_1.roleServiceProvider,
        node: core_generators_1.nodeProvider,
        appModule: root_module_1.appModuleProvider,
        configService: config_service_1.configServiceProvider,
        prismaOutput: prisma_1.prismaOutputProvider,
        errorHandlerService: error_handler_service_1.errorHandlerServiceProvider
    },
    exports: {
        auth0Module: exports.auth0ModuleProvider,
        authInfoImport: auth_service_1.authInfoImportProvider,
        authServiceImport: auth_service_1.authServiceImportProvider
    },
    createGenerator: function (_a, _b) {
        var _this = this;
        var userModelName = _a.userModelName, includeManagement = _a.includeManagement;
        var node = _b.node, typescript = _b.typescript, roleService = _b.roleService, prismaOutput = _b.prismaOutput, configService = _b.configService, appModule = _b.appModule, errorHandlerService = _b.errorHandlerService;
        node.addPackages({
            'fastify-auth0-verify': '0.8.0',
            '@fastify/request-context': '4.0.0'
        });
        if (includeManagement) {
            node.addPackages({
                auth0: '3.2.0'
            });
            node.addDevPackages({
                '@types/auth0': '2.35.9'
            });
        }
        var _c = (0, core_generators_1.makeImportAndFilePath)("".concat(appModule.getModuleFolder(), "/plugins/auth0-plugin.ts")), pluginImport = _c[0], pluginPath = _c[1];
        var _d = (0, core_generators_1.makeImportAndFilePath)("".concat(appModule.getModuleFolder(), "/services/auth-service.ts")), authServiceImport = _d[0], authServicePath = _d[1];
        var _e = (0, core_generators_1.makeImportAndFilePath)("".concat(appModule.getModuleFolder(), "/utils/auth-info.ts")), authInfoImport = _e[0], authInfoPath = _e[1];
        appModule.registerFieldEntry('plugins', core_generators_1.TypescriptCodeUtils.createExpression('auth0Plugin', "import {auth0Plugin} from '".concat(pluginImport, "'")));
        configService.getConfigEntries().set('AUTH0_DOMAIN', {
            value: core_generators_1.TypescriptCodeUtils.createExpression('z.string().min(1)'),
            comment: 'Auth0 domain (can be custom domain)',
            seedValue: 'subdomain.auth0.com',
            exampleValue: '<AUTH0_DOMAIN>'
        });
        configService.getConfigEntries().set('AUTH0_AUDIENCE', {
            value: core_generators_1.TypescriptCodeUtils.createExpression('z.string().min(1)'),
            comment: 'Auth0 audience',
            seedValue: 'https://api.example.com',
            exampleValue: '<AUTH0_AUDIENCE>'
        });
        var _f = (0, core_generators_1.makeImportAndFilePath)("".concat(appModule.getModuleFolder(), "/services/management.ts")), managementPath = _f[1];
        if (includeManagement) {
            configService.getConfigEntries().set('AUTH0_TENANT_DOMAIN', {
                value: core_generators_1.TypescriptCodeUtils.createExpression('z.string().min(1)'),
                comment: 'Auth0 tenant domain (ends with auth0.com), e.g. domain.auth0.com',
                seedValue: 'domain.auth0.com',
                exampleValue: '<AUTH0_TENANT_DOMAIN>'
            });
            configService.getConfigEntries().set('AUTH0_CLIENT_ID', {
                value: core_generators_1.TypescriptCodeUtils.createExpression('z.string().min(1)'),
                comment: 'Auth0 management client ID (https://auth0.com/docs/get-started/auth0-overview/create-applications/machine-to-machine-apps)',
                seedValue: 'CLIENT_ID',
                exampleValue: '<AUTH0_CLIENT_ID>'
            });
            configService.getConfigEntries().set('AUTH0_CLIENT_SECRET', {
                value: core_generators_1.TypescriptCodeUtils.createExpression('z.string().min(1)'),
                comment: 'Auth0 management client secret',
                seedValue: 'CLIENT_SECRET',
                exampleValue: '<AUTH0_CLIENT_SECRET>'
            });
        }
        return {
            getProviders: function () { return ({
                auth0Module: {},
                authInfoImport: {
                    getImportMap: function () { return ({
                        '%auth-info': {
                            path: authInfoImport,
                            allowedImports: [
                                'createAuthInfoFromUser',
                                'UserInfo',
                                'AuthInfo',
                            ]
                        }
                    }); }
                },
                authServiceImport: {
                    getImportMap: function () { return ({
                        '%auth-service': {
                            path: authServicePath,
                            allowedImports: [
                                'createAuthInfoFromRequest',
                                'createAuthInfoFromAuthorization',
                            ]
                        }
                    }); },
                    getAuthInfoCreator: function (request, token) {
                        return core_generators_1.TypescriptCodeUtils.formatExpression("await createAuthInfoFromAuthorization(REQUEST, TOKEN)", { REQUEST: request, TOKEN: token }, {
                            importText: [
                                "import { createAuthInfoFromAuthorization } from '".concat(authServiceImport, "'"),
                            ]
                        });
                    }
                }
            }); },
            build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                var pluginFile, serviceFile, authInfoFile;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pluginFile = typescript.createTemplate({}, { importMappers: [configService] });
                            return [4 /*yield*/, builder.apply(pluginFile.renderToAction('plugins/auth0-plugin.ts', pluginPath))];
                        case 1:
                            _a.sent();
                            serviceFile = typescript.createTemplate({
                                USER_MODEL: prismaOutput.getPrismaModelExpression(userModelName),
                                AUTH_ROLE_SERVICE: roleService.getServiceExpression()
                            }, { importMappers: [configService, roleService] });
                            return [4 /*yield*/, builder.apply(serviceFile.renderToAction('services/auth-service.ts', authServicePath))];
                        case 2:
                            _a.sent();
                            authInfoFile = typescript.createTemplate({}, { importMappers: [roleService, errorHandlerService] });
                            return [4 /*yield*/, builder.apply(authInfoFile.renderToAction('utils/auth-info.ts', authInfoPath))];
                        case 3:
                            _a.sent();
                            if (!includeManagement) return [3 /*break*/, 5];
                            return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                    source: 'services/management.ts',
                                    destination: managementPath,
                                    importMappers: [configService]
                                }))];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5: return [2 /*return*/];
                    }
                });
            }); }
        };
    }
});
exports["default"] = Auth0ModuleGenerator;
