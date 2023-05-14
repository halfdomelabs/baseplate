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
exports.prismaOutputProvider = exports.prismaSchemaProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var internals_1 = require("@prisma/internals");
var zod_1 = require("zod");
var config_service_1 = require("@src/generators/core/config-service");
var fastify_1 = require("@src/generators/core/fastify");
var fastify_health_check_1 = require("@src/generators/core/fastify-health-check");
var schema_1 = require("@src/writers/prisma-schema/schema");
var descriptorSchema = zod_1.z.object({
    defaultPort: zod_1.z.number()["default"](5432),
    defaultDatabaseUrl: zod_1.z.string().optional()
});
exports.prismaSchemaProvider = (0, sync_1.createProviderType)('prisma-schema');
exports.prismaOutputProvider = (0, sync_1.createProviderType)('prisma-output');
var PrismaGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        var schemaTask = taskBuilder.addTask({
            name: 'schema',
            dependencies: {
                node: core_generators_1.nodeProvider,
                configService: config_service_1.configServiceProvider,
                project: core_generators_1.projectProvider,
                fastifyHealthCheck: fastify_health_check_1.fastifyHealthCheckProvider,
                fastifyOutput: fastify_1.fastifyOutputProvider,
                typescript: core_generators_1.typescriptProvider
            },
            exports: { prismaSchema: exports.prismaSchemaProvider },
            run: function (_a) {
                var _this = this;
                var node = _a.node, configService = _a.configService, project = _a.project, fastifyHealthCheck = _a.fastifyHealthCheck, fastifyOutput = _a.fastifyOutput, typescript = _a.typescript;
                node.addDevPackages({
                    prisma: '4.11.0'
                });
                node.addPackages({
                    '@prisma/client': '4.11.0'
                });
                node.mergeExtraProperties({
                    prisma: {
                        seed: "ts-node ".concat(fastifyOutput.getDevLoaderString(), " src/prisma/seed.ts")
                    }
                });
                var schemaFile = new schema_1.PrismaSchemaFile();
                schemaFile.addGeneratorBlock((0, schema_1.createPrismaSchemaGeneratorBlock)({
                    name: 'client',
                    provider: 'prisma-client-js'
                }));
                schemaFile.setDatasourceBlock((0, schema_1.createPrismaSchemaDatasourceBlock)({
                    name: 'db',
                    provider: 'postgresql',
                    url: 'env("DATABASE_URL")'
                }));
                var defaultDatabaseUrl = descriptor.defaultDatabaseUrl ||
                    "postgres://postgres:".concat(project.getProjectName(), "-password@localhost:").concat(descriptor.defaultPort, "/postgres?schema=public");
                configService.getConfigEntries().set('DATABASE_URL', {
                    comment: 'Connection URL of the database',
                    value: core_generators_1.TypescriptCodeUtils.createExpression('z.string().min(1)'),
                    exampleValue: defaultDatabaseUrl
                });
                fastifyHealthCheck.addCheck(core_generators_1.TypescriptCodeUtils.createBlock('// check Prisma is operating\nawait prisma.$queryRaw`SELECT 1;`;', "import { prisma } from '@/src/services/prisma'"));
                return {
                    getProviders: function () { return ({
                        prismaSchema: {
                            addPrismaGenerator: function (generator) {
                                schemaFile.addGeneratorBlock(generator);
                            },
                            addPrismaModel: function (model) {
                                schemaFile.addModelWriter(model);
                            },
                            addPrismaEnum: function (block) {
                                schemaFile.addEnum(block);
                            }
                        }
                    }); },
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        var schemaText, formattedSchemaText, seedFile;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    schemaText = schemaFile.toText();
                                    return [4 /*yield*/, (0, internals_1.formatSchema)({
                                            schema: schemaText
                                        })];
                                case 1:
                                    formattedSchemaText = (_a.sent());
                                    builder.writeFile('prisma/schema.prisma', "".concat(formattedSchemaText.trimEnd(), "\n"));
                                    builder.addPostWriteCommand('yarn prisma generate', {
                                        onlyIfChanged: ['prisma/schema.prisma']
                                    });
                                    return [4 /*yield*/, builder.apply((0, core_generators_1.copyTypescriptFileAction)({
                                            source: 'services/prisma.ts',
                                            destination: 'src/services/prisma.ts'
                                        }))];
                                case 2:
                                    _a.sent();
                                    seedFile = typescript.createTemplate({
                                        PRISMA_SERVICE: { type: 'code-expression' }
                                    });
                                    seedFile.addCodeEntries({
                                        PRISMA_SERVICE: core_generators_1.TypescriptCodeUtils.createExpression('prisma', "import { prisma } from '@/src/services/prisma'")
                                    });
                                    return [4 /*yield*/, builder.apply(seedFile.renderToAction('prisma/seed.ts', 'src/prisma/seed.ts', {
                                            neverOverwrite: true
                                        }))];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/, { schemaFile: schemaFile }];
                            }
                        });
                    }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'output',
            exports: { prismaOutput: exports.prismaOutputProvider },
            taskDependencies: { schemaTask: schemaTask },
            run: function (deps, _a) {
                var schemaFile = _a.schemaTask.schemaFile;
                return {
                    getProviders: function () { return ({
                        prismaOutput: {
                            getImportMap: function () { return ({
                                '%prisma-service': {
                                    path: '@/src/services/prisma',
                                    allowedImports: ['prisma']
                                }
                            }); },
                            getPrismaServicePath: function () { return '@/src/services/prisma'; },
                            getPrismaClient: function () {
                                return core_generators_1.TypescriptCodeUtils.createExpression('prisma', "import { prisma } from '@/src/services/prisma'");
                            },
                            getPrismaModel: function (modelName) {
                                var modelBlock = schemaFile.getModelBlock(modelName);
                                if (!modelBlock) {
                                    throw new Error("Model ".concat(modelName, " not found"));
                                }
                                return modelBlock;
                            },
                            getServiceEnum: function (name) {
                                var block = schemaFile.getEnum(name);
                                if (!block) {
                                    throw new Error("Enum ".concat(name, " not found"));
                                }
                                return {
                                    name: block.name,
                                    values: block.values,
                                    expression: core_generators_1.TypescriptCodeUtils.createExpression(block.name, "import { ".concat(block.name, " } from '@prisma/client'"))
                                };
                            },
                            getPrismaModelExpression: function (modelName) {
                                var modelExport = modelName.charAt(0).toLocaleLowerCase() + modelName.slice(1);
                                return core_generators_1.TypescriptCodeUtils.createExpression("prisma.".concat(modelExport), "import { prisma } from '@/src/services/prisma'");
                            },
                            getModelTypeExpression: function (modelName) {
                                return core_generators_1.TypescriptCodeUtils.createExpression(modelName, "import { ".concat(modelName, " } from '@prisma/client'"));
                            }
                        }
                    }); }
                };
            }
        });
    }
});
exports["default"] = PrismaGenerator;
