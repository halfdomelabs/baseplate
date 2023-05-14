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
exports.nexusProvider = exports.nexusSchemaProvider = exports.nexusSetupProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var fastify_1 = require("@src/generators/core/fastify");
var request_service_context_1 = require("@src/generators/core/request-service-context");
var root_module_1 = require("@src/generators/core/root-module");
var yoga_plugin_1 = require("@src/generators/yoga/yoga-plugin");
var scalars_1 = require("@src/writers/nexus-definition/scalars");
var descriptorSchema = zod_1.z.object({
    enableSubscriptions: zod_1.z.boolean().optional()
});
exports.nexusSetupProvider = (0, sync_1.createProviderType)('nexus-setup');
exports.nexusSchemaProvider = (0, sync_1.createProviderType)('nexus-schema');
exports.nexusProvider = (0, sync_1.createProviderType)('nexus');
var NexusGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder) {
        // Setup Task
        var setupTask = taskBuilder.addTask({
            name: 'setup',
            dependencies: {},
            exports: { nexusSetup: exports.nexusSetupProvider },
            run: function () {
                var configMap = (0, sync_1.createNonOverwriteableMap)({ nexusPlugins: [], mutationFields: [] }, { name: 'nexus-config' });
                configMap.appendUnique('nexusPlugins', [
                    new core_generators_1.TypescriptCodeExpression('connectionPlugin({ includeNodesField: true })', "import { connectionPlugin } from 'nexus'"),
                ]);
                configMap.appendUnique('nexusPlugins', [
                    new core_generators_1.TypescriptCodeExpression('missingTypePlugin', "import { missingTypePlugin } from './missing-type-plugin'"),
                ]);
                var scalarMap = (0, sync_1.createNonOverwriteableMap)(scalars_1.DEFAULT_NEXUS_SCALAR_CONFIG, {
                    defaultsOverwriteable: true,
                    name: 'nexus-scalars'
                });
                var schemaFiles = [];
                var importMap = {
                    '%nexus/utils': {
                        path: '@/src/utils/nexus',
                        allowedImports: ['createStandardMutation']
                    },
                    '%nexus/typegen': {
                        path: '@/src/nexus-typegen',
                        allowedImports: ['NexusGenFieldTypes']
                    }
                };
                return {
                    getProviders: function () {
                        return {
                            nexusSetup: {
                                addScalarField: function (config) {
                                    scalarMap.set(config.scalar, config);
                                },
                                registerSchemaFile: function (file) { return schemaFiles.push(file); },
                                getConfig: function () { return configMap; },
                                getImportMap: function () { return importMap; }
                            }
                        };
                    },
                    build: function () {
                        return { scalarMap: scalarMap, schemaFiles: schemaFiles, configMap: configMap, importMap: importMap };
                    }
                };
            }
        });
        // Setup Fastify
        taskBuilder.addTask({
            name: 'root',
            dependencies: {
                rootModule: root_module_1.rootModuleProvider
            },
            run: function (_a) {
                var rootModule = _a.rootModule;
                rootModule.addModuleField('schemaTypes', new core_generators_1.TypescriptCodeExpression('NexusType', "import type {NexusType} from '@/src/utils/nexus'"));
                return {};
            }
        });
        // Schema Task
        taskBuilder.addTask({
            name: 'schema',
            taskDependencies: { setupTask: setupTask },
            exports: {
                nexusSchema: exports.nexusSchemaProvider
            },
            run: function (deps, _a) {
                var _b = _a.setupTask, scalarMap = _b.scalarMap, schemaFiles = _b.schemaFiles, importMap = _b.importMap;
                var getScalarConfig = function (scalar) {
                    var config = scalarMap.get(scalar);
                    if (!config) {
                        throw new Error("No config found for scalar ".concat(scalar));
                    }
                    return config;
                };
                var usedSchemaTypes = [];
                return {
                    getProviders: function () {
                        return {
                            nexusSchema: {
                                getScalarConfig: getScalarConfig,
                                registerSchemaFile: function (file) { return schemaFiles.push(file); },
                                registerSchemaType: function (name) {
                                    if (usedSchemaTypes.includes(name)) {
                                        return false;
                                    }
                                    usedSchemaTypes.push(name);
                                    return true;
                                },
                                getUtilsImport: function () { return '@/src/utils/nexus'; },
                                getNexusWriterOptions: function () { return ({
                                    builder: 't',
                                    lookupScalar: function (scalar) { return getScalarConfig(scalar); }
                                }); },
                                getUtilsExpression: function (method) {
                                    switch (method) {
                                        case 'STANDARD_MUTATION':
                                            return new core_generators_1.TypescriptCodeExpression('createStandardMutation', "import {createStandardMutation} from '@/src/utils/nexus'");
                                        default:
                                            throw new Error("Unknown method ".concat(method));
                                    }
                                },
                                getImportMap: function () { return importMap; }
                            }
                        };
                    },
                    build: function () {
                        return { usedSchemaTypes: usedSchemaTypes };
                    }
                };
            }
        });
        taskBuilder.addTask({
            name: 'main',
            taskDependencies: { setupTask: setupTask },
            dependencies: {
                node: core_generators_1.nodeProvider,
                typescript: core_generators_1.typescriptProvider,
                tsUtils: core_generators_1.tsUtilsProvider,
                eslint: core_generators_1.eslintProvider,
                requestServiceContext: request_service_context_1.requestServiceContextProvider,
                prettier: core_generators_1.prettierProvider,
                rootModuleImport: root_module_1.rootModuleImportProvider,
                yogaPluginSetup: yoga_plugin_1.yogaPluginSetupProvider
            },
            exports: {
                nexus: exports.nexusProvider
            },
            run: function (_a, _b) {
                var node = _a.node, typescript = _a.typescript, requestServiceContext = _a.requestServiceContext, eslint = _a.eslint, prettier = _a.prettier, tsUtils = _a.tsUtils, rootModuleImport = _a.rootModuleImport;
                var _c = _b.setupTask, configMap = _c.configMap, schemaFiles = _c.schemaFiles;
                node.addPackages({
                    nexus: '1.3.0'
                });
                // ignore nexus typegen file
                eslint
                    .getConfig()
                    .appendUnique('eslintIgnore', ['src/nexus-typegen.ts']);
                prettier.addPrettierIgnore('/src/nexus-typegen.ts');
                prettier.addPrettierIgnore('/schema.graphql');
                return {
                    getProviders: function () {
                        return { nexus: { getConfig: function () { return configMap; } } };
                    },
                    build: function (builder) {
                        return __awaiter(this, void 0, void 0, function () {
                            var config, utilsFile, schemaExpression;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        config = configMap.value();
                                        utilsFile = typescript.createTemplate({
                                            CUSTOM_CREATE_MUTATION_OPTIONS: { type: 'code-block' },
                                            CUSTOM_MUTATION_FIELDS: {
                                                type: 'string-replacement',
                                                asSingleLineComment: true
                                            }
                                        }, {
                                            importMappers: [tsUtils]
                                        });
                                        utilsFile.addCodeEntries({
                                            CUSTOM_MUTATION_FIELDS: new core_generators_1.TypescriptStringReplacement(config.mutationFields.map(function (f) { return f.name; }).join(',\n')),
                                            CUSTOM_CREATE_MUTATION_OPTIONS: config.mutationFields.map(function (f) {
                                                return f.type
                                                    .prepend("".concat("".concat(f.name).concat(f.isOptional ? '?' : ''), ": "))
                                                    .toBlock();
                                            })
                                        });
                                        return [4 /*yield*/, builder.apply(utilsFile.renderToAction('utils/nexus.ts', 'src/utils/nexus.ts'))];
                                    case 1:
                                        _a.sent();
                                        schemaExpression = core_generators_1.TypescriptCodeUtils.formatExpression("makeSchema({\n                types: ROOT_MODULE.schemaTypes,\n                outputs: {\n                  typegen: join(__dirname, '../..', 'nexus-typegen.ts'),\n                  schema: join(__dirname, '../../..', 'schema.graphql'),\n                },\n                plugins: NEXUS_PLUGINS,\n                contextType: {\n                  module: join(__dirname, '../../..', 'CONTEXT_PATH'),\n                  export: 'RequestServiceContext',\n                },\n                shouldExitAfterGenerateArtifacts: process.argv.includes('--nexus-exit'),\n              })", {
                                            ROOT_MODULE: rootModuleImport.getRootModule(),
                                            NEXUS_PLUGINS: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsArray(config.nexusPlugins),
                                            CONTEXT_PATH: requestServiceContext.getContextPath()
                                        }, {
                                            importText: [
                                                "import { makeSchema } from 'nexus';",
                                                "import { join } from 'path';",
                                            ]
                                        });
                                        // yogaPluginSetup.getConfig().set('schema', schemaExpression);
                                        return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                                source: 'plugins/graphql/missing-type-plugin.ts',
                                                destination: 'src/plugins/graphql/missing-type-plugin.ts'
                                            }))];
                                    case 2:
                                        // yogaPluginSetup.getConfig().set('schema', schemaExpression);
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    }
                };
            }
        });
        // split out nexusgen steps to avoid cyclical dependencies
        taskBuilder.addTask({
            name: 'nexusgen',
            dependencies: {
                node: core_generators_1.nodeProvider,
                fastifyOutput: fastify_1.fastifyOutputProvider
            },
            run: function (_a) {
                var node = _a.node, fastifyOutput = _a.fastifyOutput;
                // add script to generate types
                node.addScript('nexusgen', "ts-node --transpile-only ".concat(fastifyOutput.getDevLoaderString(), " src --nexus-exit"));
                return {};
            }
        });
    }
});
exports["default"] = NexusGenerator;
