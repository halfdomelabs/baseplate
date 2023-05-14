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
exports.authMutationsProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var config_service_1 = require("@src/generators/core/config-service");
var request_service_context_1 = require("@src/generators/core/request-service-context");
var root_module_1 = require("@src/generators/core/root-module");
var nexus_1 = require("@src/generators/nexus/nexus");
var nexus_auth_1 = require("@src/generators/nexus/nexus-auth");
var auth_service_1 = require("../auth-service");
var descriptorSchema = zod_1.z.object({
    placeholder: zod_1.z.string().optional()
});
exports.authMutationsProvider = (0, sync_1.createProviderType)('auth-mutations', { isReadOnly: true });
var AuthMutationsGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        appModule: root_module_1.appModuleProvider,
        nexusSchema: nexus_1.nexusSchemaProvider,
        authServiceImport: auth_service_1.authServiceImportProvider,
        typescript: core_generators_1.typescriptProvider,
        configService: config_service_1.configServiceProvider,
        nexusAuth: nexus_auth_1.nexusAuthProvider,
        requestServiceContext: request_service_context_1.requestServiceContextProvider
    },
    exports: {
        authMutations: exports.authMutationsProvider
    },
    createGenerator: function (descriptor, _a) {
        var _this = this;
        var appModule = _a.appModule, nexusSchema = _a.nexusSchema, authServiceImport = _a.authServiceImport, typescript = _a.typescript, configService = _a.configService, nexusAuth = _a.nexusAuth, requestServiceContext = _a.requestServiceContext;
        var appModuleFolder = appModule.getModuleFolder();
        var authMutationsFile = typescript.createTemplate({
            AUTHORIZE_USER: { type: 'code-expression' },
            AUTHORIZE_ANONYMOUS: { type: 'code-expression' }
        }, {
            importMappers: [configService, authServiceImport, nexusSchema]
        });
        authMutationsFile.addCodeEntries({
            AUTHORIZE_USER: nexusAuth.formatAuthorizeConfig({ roles: ['user'] }),
            AUTHORIZE_ANONYMOUS: nexusAuth.formatAuthorizeConfig({
                roles: ['anonymous']
            })
        });
        nexusSchema.registerSchemaFile("".concat(appModuleFolder, "/schema/auth-mutations.ts"));
        appModule.registerFieldEntry('schemaTypes', new core_generators_1.TypescriptCodeExpression('authMutations', "import * as authMutations from '@/".concat(appModuleFolder, "/schema/auth-mutations'")));
        return {
            getProviders: function () { return ({
                authMutations: {
                    getImportMap: function () { return ({
                        '%auth-mutations/refresh-token': {
                            path: "@/".concat(appModuleFolder, "/utils/refresh-tokens"),
                            allowedImports: [
                                'setRefreshTokenIntoCookie',
                                'clearRefreshTokenFromCookie',
                                'formatRefreshTokens',
                            ]
                        }
                    }); }
                }
            }); },
            build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            builder.setBaseDirectory(appModule.getModuleFolder());
                            return [4 /*yield*/, builder.apply(authMutationsFile.renderToAction('schema/auth-mutations.ts'))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                    source: 'utils/refresh-tokens.ts',
                                    importMappers: [configService, nexusSchema, requestServiceContext]
                                }))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        };
    }
});
exports["default"] = AuthMutationsGenerator;
