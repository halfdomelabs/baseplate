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
exports.fastifyBullBoardProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var error_handler_service_1 = require("@src/generators/core/error-handler-service");
var fastify_redis_1 = require("@src/generators/core/fastify-redis");
var fastify_server_1 = require("@src/generators/core/fastify-server");
var root_module_1 = require("@src/generators/core/root-module");
var pothos_1 = require("@src/generators/pothos/pothos");
var descriptorSchema = zod_1.z.object({});
exports.fastifyBullBoardProvider = (0, sync_1.createProviderType)('fastify-bull-board');
var createMainTask = (0, sync_1.createTaskConfigBuilder)(function () { return ({
    name: 'main',
    dependencies: {
        node: core_generators_1.nodeProvider,
        typescript: core_generators_1.typescriptProvider,
        errorHandlerService: error_handler_service_1.errorHandlerServiceProvider,
        redis: fastify_redis_1.fastifyRedisProvider,
        pothosSchema: pothos_1.pothosSchemaProvider,
        appModule: root_module_1.appModuleProvider
    },
    exports: {
        fastifyBullBoard: exports.fastifyBullBoardProvider
    },
    run: function (_a) {
        var _this = this;
        var node = _a.node, typescript = _a.typescript, errorHandlerService = _a.errorHandlerService, redis = _a.redis, pothosSchema = _a.pothosSchema, appModule = _a.appModule;
        var queuesToTrack = [];
        pothosSchema.registerSchemaFile("".concat(appModule.getModuleFolder(), "/schema/authenticate.mutations.ts"));
        node.addPackages({
            '@bull-board/api': '4.3.2',
            '@bull-board/fastify': '4.3.2',
            ms: '2.1.3'
        });
        // required for bull-board to compile
        node.addDevPackages({
            '@types/redis-info': '3.0.0',
            '@types/ms': '0.7.31'
        });
        return {
            getProviders: function () { return ({
                fastifyBullBoard: {
                    addQueueToTrack: function (queue) {
                        queuesToTrack.push(queue);
                    }
                }
            }); },
            build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                var importMappers, pluginFile, moduleFolder;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            importMappers = [errorHandlerService, redis, pothosSchema];
                            pluginFile = typescript.createTemplate({
                                QUEUES_TO_TRACK: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsArray(queuesToTrack)
                            }, { importMappers: importMappers });
                            moduleFolder = "".concat(appModule.getModuleFolder(), "/bull-board");
                            appModule.registerFieldEntry('children', core_generators_1.TypescriptCodeUtils.createExpression('bullBoardModule', "import { bullBoardModule } from '@/".concat(moduleFolder, "'")));
                            return [4 /*yield*/, builder.apply(pluginFile.renderToAction('plugins/bull-board.ts', "".concat(moduleFolder, "/plugins/bull-board.ts")))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, builder.apply(typescript.createCopyFilesAction({
                                    destinationBaseDirectory: moduleFolder,
                                    paths: [
                                        'schema/authenticate.mutations.ts',
                                        'services/auth.service.ts',
                                        'index.ts',
                                    ],
                                    importMappers: importMappers
                                }))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        };
    }
}); });
var FastifyBullBoardGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        taskBuilder.addTask(createMainTask(descriptor));
        taskBuilder.addTask({
            name: 'formBody',
            dependencies: {
                node: core_generators_1.nodeProvider,
                fastifyServer: fastify_server_1.fastifyServerProvider
            },
            run: function (_a) {
                var node = _a.node, fastifyServer = _a.fastifyServer;
                node.addPackages({
                    '@fastify/formbody': '7.3.0'
                });
                fastifyServer.registerPlugin({
                    name: 'formBodyPlugin',
                    plugin: new core_generators_1.TypescriptCodeExpression('formBodyPlugin', "import formBodyPlugin from '@fastify/formbody'")
                });
                return {};
            }
        });
    }
});
exports["default"] = FastifyBullBoardGenerator;
