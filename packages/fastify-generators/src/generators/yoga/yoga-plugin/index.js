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
exports.yogaPluginProvider = exports.yogaPluginSetupProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var auth_service_1 = require("@src/generators/auth/auth-service");
var config_service_1 = require("@src/generators/core/config-service");
var error_handler_service_1 = require("@src/generators/core/error-handler-service");
var fastify_redis_1 = require("@src/generators/core/fastify-redis");
var fastify_server_1 = require("@src/generators/core/fastify-server");
var logger_service_1 = require("@src/generators/core/logger-service");
var request_service_context_1 = require("@src/generators/core/request-service-context");
var descriptorSchema = zod_1.z.object({
    enableSubscriptions: zod_1.z.boolean().optional()
});
exports.yogaPluginSetupProvider = (0, sync_1.createProviderType)('yoga-plugin-setup');
exports.yogaPluginProvider = (0, sync_1.createProviderType)('yoga-plugin');
var YogaPluginGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, _a) {
        var enableSubscriptions = _a.enableSubscriptions;
        // Setup Task
        var setupTask = taskBuilder.addTask({
            name: 'setup',
            dependencies: {},
            exports: { yogaPluginSetup: exports.yogaPluginSetupProvider },
            run: function () {
                var configMap = (0, sync_1.createNonOverwriteableMap)({
                    envelopPlugins: [],
                    postSchemaBlocks: [],
                    customImports: [],
                    schema: new core_generators_1.TypescriptCodeExpression("new GraphQLSchema({})", "import { GraphQLSchema } from 'graphql';")
                }, {
                    defaultsOverwriteable: true
                });
                configMap.appendUnique('envelopPlugins', [
                    new core_generators_1.TypescriptCodeExpression('useGraphLogger()', "import { useGraphLogger } from './useGraphLogger'"),
                ]);
                configMap.appendUnique('envelopPlugins', [
                    new core_generators_1.TypescriptCodeExpression('useDisableIntrospection({ disableIf: () => !IS_DEVELOPMENT })', "import { useDisableIntrospection } from '@envelop/disable-introspection';"),
                ]);
                return {
                    getProviders: function () {
                        return {
                            yogaPluginSetup: {
                                getConfig: function () { return configMap; },
                                isSubscriptionEnabled: function () { return !!enableSubscriptions; }
                            }
                        };
                    },
                    build: function () {
                        return { configMap: configMap };
                    }
                };
            }
        });
        // Setup Fastify
        taskBuilder.addTask({
            name: 'fastify',
            dependencies: {
                fastifyServer: fastify_server_1.fastifyServerProvider
            },
            run: function (_a) {
                var fastifyServer = _a.fastifyServer;
                fastifyServer.registerPlugin({
                    name: 'graphqlPlugin',
                    plugin: new core_generators_1.TypescriptCodeExpression('graphqlPlugin', "import { graphqlPlugin } from '@/src/plugins/graphql'")
                });
                return {};
            }
        });
        taskBuilder.addTask({
            name: 'main',
            taskDependencies: { setupTask: setupTask },
            dependencies: {
                node: core_generators_1.nodeProvider,
                typescript: core_generators_1.typescriptProvider,
                configService: config_service_1.configServiceProvider,
                errorHandlerService: error_handler_service_1.errorHandlerServiceProvider,
                requestServiceContext: request_service_context_1.requestServiceContextProvider,
                loggerService: logger_service_1.loggerServiceProvider
            },
            exports: {
                yogaPlugin: exports.yogaPluginProvider
            },
            run: function (_a, _b) {
                var node = _a.node, typescript = _a.typescript, configService = _a.configService, requestServiceContext = _a.requestServiceContext, loggerService = _a.loggerService, errorHandlerService = _a.errorHandlerService;
                var configMap = _b.setupTask.configMap;
                node.addPackages({
                    'altair-fastify-plugin': '4.6.4',
                    graphql: '16.6.0',
                    '@envelop/core': '2.6.0',
                    '@envelop/disable-introspection': '3.6.0',
                    '@graphql-yoga/node': '2.13.12'
                });
                node.addDevPackages({
                    '@envelop/types': '2.4.0'
                });
                // needed to properly compile (https://github.com/fastify/fastify-websocket/issues/90)
                node.addDevPackages({
                    '@types/ws': '8.5.3'
                });
                return {
                    getProviders: function () {
                        return { yogaPlugin: { getConfig: function () { return configMap; } } };
                    },
                    build: function (builder) {
                        return __awaiter(this, void 0, void 0, function () {
                            var config, pluginFile;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        config = configMap.value();
                                        pluginFile = typescript.createTemplate({
                                            SCHEMA: { type: 'code-expression' },
                                            ROOT_MODULE: { type: 'code-expression' },
                                            ENVELOP_PLUGINS: { type: 'code-expression' },
                                            GRAPHQL_HANDLER: { type: 'code-block' },
                                            POST_SCHEMA_BLOCKS: core_generators_1.TypescriptCodeUtils.mergeBlocks(config.postSchemaBlocks, '\n\n'),
                                            CUSTOM_IMPORTS: core_generators_1.TypescriptCodeUtils.mergeBlocks(config.customImports)
                                        }, {
                                            importMappers: [
                                                errorHandlerService,
                                                configService,
                                                requestServiceContext,
                                                loggerService,
                                            ]
                                        });
                                        pluginFile.addCodeExpression('SCHEMA', config.schema);
                                        pluginFile.addCodeExpression('ENVELOP_PLUGINS', core_generators_1.TypescriptCodeUtils.mergeExpressionsAsArray(config.envelopPlugins));
                                        pluginFile.addCodeBlock('GRAPHQL_HANDLER', enableSubscriptions
                                            ? core_generators_1.TypescriptCodeUtils.createBlock("fastify.route({\n                  url: '/graphql',\n                  method: 'GET',\n                  handler: httpHandler,\n                  wsHandler: getGraphqlWsHandler(graphQLServer),\n                });\n                \n                fastify.route({\n                  url: '/graphql',\n                  method: ['POST', 'OPTIONS'],\n                  handler: httpHandler,\n                });", "import { getGraphqlWsHandler } from './websocket';")
                                            : "fastify.route({\n              url: '/graphql',\n              method: ['GET', 'POST', 'OPTIONS'],\n              handler: httpHandler,\n            });");
                                        return [4 /*yield*/, builder.apply(pluginFile.renderToAction('plugins/graphql/index.ts', 'src/plugins/graphql/index.ts'))];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                                source: 'plugins/graphql/useGraphLogger.ts',
                                                destination: 'src/plugins/graphql/useGraphLogger.ts',
                                                importMappers: [loggerService]
                                            }))];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    }
                };
            }
        });
        if (enableSubscriptions) {
            taskBuilder.addTask({
                name: 'server-websocket',
                dependencies: {
                    node: core_generators_1.nodeProvider,
                    fastifyServer: fastify_server_1.fastifyServerProvider
                },
                run: function (_a) {
                    var node = _a.node, fastifyServer = _a.fastifyServer;
                    node.addPackages({
                        '@fastify/websocket': '7.0.1'
                    });
                    fastifyServer.registerPlugin({
                        name: 'websocketPlugin',
                        plugin: core_generators_1.TypescriptCodeUtils.createExpression('websocketPlugin', "import websocketPlugin from '@fastify/websocket';"),
                        orderPriority: 'EARLY'
                    });
                    return {};
                }
            });
            taskBuilder.addTask({
                name: 'subscription',
                dependencies: {
                    node: core_generators_1.nodeProvider,
                    typescript: core_generators_1.typescriptProvider,
                    fastifyRedis: fastify_redis_1.fastifyRedisProvider,
                    authServiceImport: auth_service_1.authServiceImportProvider,
                    errorLoggerService: error_handler_service_1.errorHandlerServiceProvider,
                    loggerService: logger_service_1.loggerServiceProvider,
                    requestServiceContext: request_service_context_1.requestServiceContextProvider
                },
                run: function (_a) {
                    var node = _a.node, typescript = _a.typescript, fastifyRedis = _a.fastifyRedis, authServiceImport = _a.authServiceImport, errorLoggerService = _a.errorLoggerService, loggerService = _a.loggerService, requestServiceContext = _a.requestServiceContext;
                    node.addPackages({
                        '@graphql-yoga/redis-event-target': '0.1.3',
                        'graphql-ws': '5.10.1'
                    });
                    var _b = (0, core_generators_1.makeImportAndFilePath)('src/plugins/graphql/pubsub.ts'), pubsubPath = _b[1];
                    var _c = (0, core_generators_1.makeImportAndFilePath)('src/plugins/graphql/websocket.ts'), websocketPath = _c[1];
                    return {
                        build: function (builder) {
                            return __awaiter(this, void 0, void 0, function () {
                                var websocketFile;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                                source: 'plugins/graphql/pubsub.ts',
                                                destination: pubsubPath,
                                                importMappers: [fastifyRedis]
                                            }))];
                                        case 1:
                                            _a.sent();
                                            websocketFile = typescript.createTemplate({
                                                AUTH_INFO_CREATOR: authServiceImport.getAuthInfoCreator(core_generators_1.TypescriptCodeUtils.createExpression('ctx.extra.request'), core_generators_1.TypescriptCodeUtils.createExpression("typeof authorizationHeader === 'string' ? authorizationHeader : undefined"))
                                            }, {
                                                importMappers: [
                                                    errorLoggerService,
                                                    loggerService,
                                                    requestServiceContext,
                                                ]
                                            });
                                            return [4 /*yield*/, builder.apply(websocketFile.renderToAction('plugins/graphql/websocket.ts', websocketPath))];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        }
                    };
                }
            });
        }
    }
});
exports["default"] = YogaPluginGenerator;
