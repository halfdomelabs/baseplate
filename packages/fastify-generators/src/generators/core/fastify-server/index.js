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
exports.fastifyServerProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var config_service_1 = require("../config-service");
var logger_service_1 = require("../logger-service");
var root_module_1 = require("../root-module");
var descriptorSchema = zod_1.z.object({
    defaultPort: zod_1.z.number()["default"](7001)
});
exports.fastifyServerProvider = (0, sync_1.createProviderType)('fastify-server');
var FastifyServerGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        node: core_generators_1.nodeProvider,
        loggerService: logger_service_1.loggerServiceProvider,
        configService: config_service_1.configServiceProvider,
        rootModule: root_module_1.rootModuleProvider,
        typescript: core_generators_1.typescriptProvider
    },
    exports: {
        fastifyServer: exports.fastifyServerProvider
    },
    createGenerator: function (descriptor, _a) {
        var _this = this;
        var loggerService = _a.loggerService, configService = _a.configService, node = _a.node, rootModule = _a.rootModule, typescript = _a.typescript;
        var configMap = (0, sync_1.createNonOverwriteableMap)({
            errorHandlerFunction: core_generators_1.TypescriptCodeUtils.createExpression('console.error')
        }, { name: 'fastify-server-config', defaultsOverwriteable: true });
        var plugins = [];
        node.addPackages({
            fastify: '4.5.3',
            '@fastify/helmet': '10.0.0',
            'fastify-plugin': '4.2.1',
            nanoid: '^3.1.30'
        });
        plugins.push({
            name: 'helmet',
            plugin: core_generators_1.TypescriptCodeUtils.createExpression('helmet', "import helmet from '@fastify/helmet'"),
            options: core_generators_1.TypescriptCodeUtils.createExpression("{\n          // disable to enable Altair to function (alright since we're a backend service)\n          contentSecurityPolicy: false,\n          crossOriginEmbedderPolicy: false,\n        }"),
            orderPriority: 'EARLY'
        });
        configService.getConfigEntries().merge({
            SERVER_HOST: {
                comment: 'Hostname to bind the server to',
                value: core_generators_1.TypescriptCodeUtils.createExpression("z.string().default('localhost')")
            },
            SERVER_PORT: {
                comment: 'Port to bind the server to',
                value: core_generators_1.TypescriptCodeUtils.createExpression("z.coerce.number().min(1).max(65535).default(".concat(descriptor.defaultPort, ")"))
            }
        });
        rootModule.addModuleField('plugins', core_generators_1.TypescriptCodeUtils.createExpression('(FastifyPluginCallback | FastifyPluginAsync)', "import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';"));
        return {
            getProviders: function () { return ({
                fastifyServer: {
                    getConfig: function () { return configMap; },
                    registerPlugin: function (plugin) { return plugins.push(plugin); }
                }
            }); },
            build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                var config, indexFile, configExpression, serverFile, orderedPlugins;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            config = configMap.value();
                            indexFile = typescript.createTemplate({
                                LOG_ERROR: { type: 'code-expression' },
                                SERVER_OPTIONS: { type: 'code-expression' },
                                SERVER_PORT: { type: 'code-expression' },
                                SERVER_HOST: { type: 'code-expression' }
                            });
                            indexFile.addCodeExpression('LOG_ERROR', config.errorHandlerFunction);
                            indexFile.addCodeExpression('SERVER_OPTIONS', core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject({
                                logger: loggerService.getLogger()
                            }));
                            configExpression = configService.getConfigExpression();
                            indexFile.addCodeExpression('SERVER_PORT', core_generators_1.TypescriptCodeUtils.appendToExpression(configExpression, '.SERVER_PORT'));
                            indexFile.addCodeExpression('SERVER_HOST', core_generators_1.TypescriptCodeUtils.appendToExpression(configExpression, '.SERVER_HOST'));
                            return [4 /*yield*/, builder.apply(indexFile.renderToAction('index.ts', 'src/index.ts'))];
                        case 1:
                            _a.sent();
                            serverFile = typescript.createTemplate({
                                PLUGINS: { type: 'code-block' },
                                ROOT_MODULE: { type: 'code-expression' }
                            });
                            orderedPlugins = ramda_1["default"].sortBy(function (plugin) {
                                switch (plugin.orderPriority) {
                                    case 'EARLY':
                                        return 0;
                                    case 'END':
                                        return 2;
                                    case 'MIDDLE':
                                    default:
                                        return 1;
                                }
                            }, plugins);
                            serverFile.addCodeBlock('PLUGINS', core_generators_1.TypescriptCodeUtils.mergeBlocks(orderedPlugins.map(function (plugin) {
                                var _a;
                                var options = (_a = plugin.options) === null || _a === void 0 ? void 0 : _a.content;
                                return new core_generators_1.TypescriptCodeBlock("await fastify.register(".concat(plugin.plugin.content).concat(options ? ", ".concat(options) : '', ");"), null, (0, core_generators_1.mergeCodeEntryOptions)([plugin.plugin, plugin.options]));
                            })));
                            serverFile.addCodeExpression('ROOT_MODULE', rootModule.getRootModule());
                            return [4 /*yield*/, builder.apply(serverFile.renderToAction('server.ts', 'src/server.ts'))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        };
    }
});
exports["default"] = FastifyServerGenerator;
