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
exports.fastifySentryProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var auth_service_1 = require("@src/generators/auth/auth-service");
var prisma_1 = require("@src/generators/prisma/prisma");
var config_service_1 = require("../config-service");
var error_handler_service_1 = require("../error-handler-service");
var fastify_server_1 = require("../fastify-server");
var request_context_1 = require("../request-context");
var descriptorSchema = zod_1.z.object({});
exports.fastifySentryProvider = (0, sync_1.createProviderType)('fastify-sentry');
var FastifySentryGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder) {
        taskBuilder.addTask({
            name: 'server',
            dependencies: {
                fastifyServer: fastify_server_1.fastifyServerProvider,
                errorHandlerServiceSetup: error_handler_service_1.errorHandlerServiceSetupProvider
            },
            run: function (_a) {
                var errorHandlerServiceSetup = _a.errorHandlerServiceSetup, fastifyServer = _a.fastifyServer;
                fastifyServer.registerPlugin({
                    name: 'sentryPlugin',
                    plugin: core_generators_1.TypescriptCodeUtils.createExpression('sentryPlugin', "import {sentryPlugin} from '@/src/plugins/sentry'"),
                    orderPriority: 'EARLY'
                });
                errorHandlerServiceSetup.getHandlerFile().addCodeBlock('HEADER', core_generators_1.TypescriptCodeUtils.createBlock("\n      export function shouldLogToSentry(error: Error): boolean {\n        if (error instanceof HttpError) {\n          return error.statusCode >= 500;\n        }\n      \n        const fastifyError = error as FastifyError;\n        if (fastifyError.statusCode) {\n          return fastifyError.statusCode <= 500;\n        }\n      \n        return true;\n      }\n              ", [
                    "import { HttpError } from '".concat(errorHandlerServiceSetup.getHttpErrorsImport(), "'"),
                    "import { FastifyError } from 'fastify';",
                ]));
                errorHandlerServiceSetup.getHandlerFile().addCodeBlock('LOGGER_ACTIONS', core_generators_1.TypescriptCodeUtils.createBlock("\n      if (error instanceof Error && shouldLogToSentry(error)) {\n        logErrorToSentry(error);\n      } else if (typeof error === 'string') {\n        logErrorToSentry(new Error(error));\n      }\n      ", "import { logErrorToSentry } from '@/src/services/sentry'"));
                return {};
            }
        });
        taskBuilder.addTask({
            name: 'main',
            dependencies: {
                node: core_generators_1.nodeProvider,
                requestContext: request_context_1.requestContextProvider,
                configService: config_service_1.configServiceProvider,
                typescript: core_generators_1.typescriptProvider,
                errorHandler: error_handler_service_1.errorHandlerServiceProvider
            },
            exports: {
                fastifySentry: exports.fastifySentryProvider
            },
            run: function (_a) {
                var _this = this;
                var node = _a.node, requestContext = _a.requestContext, configService = _a.configService, typescript = _a.typescript, errorHandler = _a.errorHandler;
                var sentryServiceFile = typescript.createTemplate({
                    CONFIG: { type: 'code-expression' },
                    REQUEST_INFO_TYPE: { type: 'code-expression' },
                    SCOPE_CONFIGURATION_BLOCKS: { type: 'code-block' },
                    SENTRY_INTEGRATIONS: { type: 'code-expression' }
                });
                node.addPackages({
                    '@sentry/node': '7.40.0',
                    '@sentry/tracing': '7.40.0',
                    lodash: '4.17.21'
                });
                node.addDevPackages({
                    '@sentry/types': '7.40.0',
                    '@types/lodash': '4.14.182'
                });
                configService.getConfigEntries().merge({
                    SENTRY_DSN: {
                        comment: 'Sentry DSN',
                        value: core_generators_1.TypescriptCodeUtils.createExpression('z.string().optional()'),
                        seedValue: '',
                        exampleValue: ''
                    }
                });
                var _b = (0, core_generators_1.makeImportAndFilePath)('src/services/sentry.ts'), serviceImport = _b[0], servicePath = _b[1];
                var importMap = {
                    '%fastify-sentry/service': {
                        path: serviceImport,
                        allowedImports: [
                            'extractSentryRequestData',
                            'configureSentryScope',
                            'logErrorToSentry',
                        ]
                    },
                    '%fastify-sentry/logger': {
                        path: errorHandler.getImportMap()['%error-logger'].path,
                        allowedImports: ['shouldLogToSentry']
                    }
                };
                var scopeConfigurationBlocks = [];
                var sentryIntegrations = [];
                sentryIntegrations.push(core_generators_1.TypescriptCodeUtils.createExpression("new Sentry.Integrations.Http({ tracing: true })"));
                return {
                    getProviders: function () { return ({
                        fastifySentry: {
                            getImportMap: function () { return importMap; },
                            addScopeConfigurationBlock: function (block) {
                                scopeConfigurationBlocks.push(block);
                            },
                            addSentryIntegration: function (integration) {
                                sentryIntegrations.push(integration);
                            }
                        }
                    }); },
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    sentryServiceFile.addCodeEntries({
                                        CONFIG: configService.getConfigExpression(),
                                        REQUEST_INFO_TYPE: requestContext.getRequestInfoType(),
                                        SCOPE_CONFIGURATION_BLOCKS: scopeConfigurationBlocks,
                                        SENTRY_INTEGRATIONS: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsArray(sentryIntegrations)
                                    });
                                    return [4 /*yield*/, builder.apply(sentryServiceFile.renderToAction('services/sentry.ts', servicePath))];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, builder.apply((0, core_generators_1.copyTypescriptFileAction)({
                                            source: 'plugins/sentry.ts',
                                            destination: 'src/plugins/sentry.ts'
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
        taskBuilder.addTask({
            name: 'auth',
            dependencies: {
                fastifySentry: exports.fastifySentryProvider,
                authInfoImport: auth_service_1.authInfoImportProvider.dependency().optional()
            },
            run: function (_a) {
                var authInfoImport = _a.authInfoImport, fastifySentry = _a.fastifySentry;
                if (authInfoImport) {
                    fastifySentry.addScopeConfigurationBlock(core_generators_1.TypescriptCodeUtils.createBlock("const userData = requestContext.get('user');\n      if (userData) {\n        scope.setUser({\n          id: userData.id,\n          email: userData.email,\n          ip_address: requestData?.ip,\n        });\n      }"));
                }
                return {};
            }
        });
        taskBuilder.addTask({
            name: 'prisma',
            dependencies: {
                fastifySentry: exports.fastifySentryProvider,
                prismaOutput: prisma_1.prismaOutputProvider
            },
            run: function (_a) {
                var fastifySentry = _a.fastifySentry, prismaOutput = _a.prismaOutput;
                fastifySentry.addSentryIntegration(core_generators_1.TypescriptCodeUtils.createExpression("new Tracing.Integrations.Prisma({ client: prisma })", [
                    "import * as Tracing from '@sentry/tracing';",
                    "import { prisma } from '%prisma-service';",
                ], { importMappers: [prismaOutput] }));
                return {};
            }
        });
    }
});
exports["default"] = FastifySentryGenerator;
