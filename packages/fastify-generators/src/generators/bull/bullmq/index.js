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
exports.bullMqProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var error_handler_service_1 = require("@src/generators/core/error-handler-service");
var fastify_1 = require("@src/generators/core/fastify");
var fastify_redis_1 = require("@src/generators/core/fastify-redis");
var logger_service_1 = require("@src/generators/core/logger-service");
var descriptorSchema = zod_1.z.object({});
exports.bullMqProvider = (0, sync_1.createProviderType)('bull-mq');
var createMainTask = (0, sync_1.createTaskConfigBuilder)(function (descriptor) { return ({
    name: 'main',
    dependencies: {
        errorHandlerService: error_handler_service_1.errorHandlerServiceProvider,
        loggerService: logger_service_1.loggerServiceProvider,
        fastifyRedis: fastify_redis_1.fastifyRedisProvider,
        node: core_generators_1.nodeProvider,
        typescript: core_generators_1.typescriptProvider,
        fastifyOutput: fastify_1.fastifyOutputProvider
    },
    exports: {
        bullMq: exports.bullMqProvider
    },
    run: function (_a) {
        var _this = this;
        var errorHandlerService = _a.errorHandlerService, loggerService = _a.loggerService, fastifyRedis = _a.fastifyRedis, node = _a.node, typescript = _a.typescript, fastifyOutput = _a.fastifyOutput;
        node.addPackages({
            bullmq: '2.1.2'
        });
        node.addDevPackages({
            nodemon: '2.0.20'
        });
        // we need to use nodemon instead of ts-node-dev because BullMQ workers can fork the process which causes issues with ts-node-dev
        node.addScripts({
            'dev:workers': "nodemon --transpile-only ".concat(fastifyOutput.getDevLoaderString(), " ./scripts/run-workers.ts | pino-pretty -t"),
            'run:workers': 'yarn run:script ./scripts/run-workers.ts'
        });
        return {
            getProviders: function () { return ({
                bullMq: {}
            }); },
            build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                var importMappers, workersFile, repeatJobsFile;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            importMappers = [
                                errorHandlerService,
                                loggerService,
                                fastifyRedis,
                            ];
                            return [4 /*yield*/, builder.apply(typescript.createCopyFilesAction({
                                    sourceBaseDirectory: 'services/bull',
                                    destinationBaseDirectory: 'src/services/bull',
                                    paths: ['index.ts', 'queue.ts', 'repeatable.ts', 'worker.ts'],
                                    importMappers: importMappers
                                }))];
                        case 1:
                            _a.sent();
                            workersFile = typescript.createTemplate({
                                WORKERS: core_generators_1.TypescriptCodeUtils.createExpression('[]')
                            }, {
                                importMappers: importMappers
                            });
                            return [4 /*yield*/, builder.apply(workersFile.renderToAction('scripts/run-workers.ts', 'scripts/run-workers.ts'))];
                        case 2:
                            _a.sent();
                            repeatJobsFile = typescript.createTemplate({
                                REPEAT_JOBS: core_generators_1.TypescriptCodeUtils.createExpression('[]')
                            }, {
                                importMappers: importMappers
                            });
                            return [4 /*yield*/, builder.apply(repeatJobsFile.renderToAction('scripts/synchronize-repeat-jobs.ts', 'scripts/synchronize-repeat-jobs.ts'))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        };
    }
}); });
var BullMqGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        taskBuilder.addTask(createMainTask(descriptor));
    }
});
exports["default"] = BullMqGenerator;
