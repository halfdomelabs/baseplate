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
exports.fastifyRedisProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var config_service_1 = require("../config-service");
var fastify_health_check_1 = require("../fastify-health-check");
var descriptorSchema = zod_1.z.object({
    defaultUrl: zod_1.z.string().min(1)
});
exports.fastifyRedisProvider = (0, sync_1.createProviderType)('fastify-redis', { isReadOnly: true });
var createMainTask = (0, sync_1.createTaskConfigBuilder)(function (_a) {
    var defaultUrl = _a.defaultUrl;
    return ({
        name: 'main',
        dependencies: {
            node: core_generators_1.nodeProvider,
            configService: config_service_1.configServiceProvider,
            fastifyHealthCheck: fastify_health_check_1.fastifyHealthCheckProvider,
            typescript: core_generators_1.typescriptProvider,
            jest: core_generators_1.jestProvider.dependency().optional()
        },
        exports: {
            fastifyRedis: exports.fastifyRedisProvider
        },
        run: function (_a) {
            var _this = this;
            var node = _a.node, configService = _a.configService, fastifyHealthCheck = _a.fastifyHealthCheck, typescript = _a.typescript, jest = _a.jest;
            node.addPackages({ ioredis: '5.2.3' });
            node.addDevPackages({ 'ioredis-mock': '8.2.2' });
            var _b = (0, core_generators_1.makeImportAndFilePath)("src/services/redis.ts"), redisImport = _b[0], redisPath = _b[1];
            var importMap = {
                '%fastify-redis': {
                    path: redisImport,
                    allowedImports: ['getRedisClient', 'createRedisClient']
                }
            };
            configService.getConfigEntries().set('REDIS_URL', {
                comment: 'Connection URL of Redis',
                value: core_generators_1.TypescriptCodeUtils.createExpression('z.string().min(1)'),
                exampleValue: defaultUrl
            });
            fastifyHealthCheck.addCheck(core_generators_1.TypescriptCodeUtils.createBlock("// check Redis is operating\n          const redisClient = getRedisClient();\n          await redisClient.ping();", "import { getRedisClient } from '%fastify-redis'", { importMappers: [{ getImportMap: function () { return importMap; } }] }));
            return {
                getProviders: function () { return ({
                    fastifyRedis: {
                        getImportMap: function () { return ({
                            '%fastify-redis': {
                                path: redisImport,
                                allowedImports: ['getRedisClient', 'createRedisClient']
                            }
                        }); }
                    }
                }); },
                build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                    var redisFile;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                redisFile = typescript.createTemplate({
                                    CONFIG: configService.getConfigExpression()
                                });
                                return [4 /*yield*/, builder.apply(redisFile.renderToAction('redis.ts', redisPath))];
                            case 1:
                                _a.sent();
                                if (!jest) return [3 /*break*/, 3];
                                return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                        source: 'mock-redis.ts',
                                        destination: 'src/tests/scripts/mock-redis.ts'
                                    }))];
                            case 2:
                                _a.sent();
                                jest
                                    .getConfig()
                                    .appendUnique('setupFilesAfterEnv', [
                                    './src/tests/scripts/mock-redis.ts',
                                ]);
                                _a.label = 3;
                            case 3: return [2 /*return*/];
                        }
                    });
                }); }
            };
        }
    });
});
var FastifyRedisGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        taskBuilder.addTask(createMainTask(descriptor));
    }
});
exports["default"] = FastifyRedisGenerator;
