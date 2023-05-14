"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.pothosProvider = exports.pothosSchemaProvider = exports.pothosSetupProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var fastify_1 = require("@src/generators/core/fastify");
var request_service_context_1 = require("@src/generators/core/request-service-context");
var root_module_1 = require("@src/generators/core/root-module");
var yoga_plugin_1 = require("@src/generators/yoga/yoga-plugin");
var pothos_1 = require("@src/writers/pothos");
var descriptorSchema = zod_1.z.object({});
exports.pothosSetupProvider = (0, sync_1.createProviderType)('pothos-setup');
exports.pothosSchemaProvider = (0, sync_1.createProviderType)('pothos-schema');
exports.pothosProvider = (0, sync_1.createProviderType)('pothos');
var PothosGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder) {
        var setupTask = taskBuilder.addTask({
            name: 'setup',
            dependencies: {},
            exports: { pothosSetup: exports.pothosSetupProvider },
            run: function () {
                var config = (0, sync_1.createNonOverwriteableMap)({
                    pothosPlugins: [],
                    schemaTypeOptions: [],
                    schemaBuilderOptions: []
                });
                var pothosTypes = new pothos_1.PothosTypeReferenceContainer();
                // TODO: Make type options/builder options
                var schemaFiles = [];
                return {
                    getProviders: function () {
                        return {
                            pothosSetup: {
                                getConfig: function () { return config; },
                                getImportMap: function () { return ({
                                    '%pothos': {
                                        path: '@/src/plugins/graphql/builder',
                                        allowedImports: ['builder']
                                    }
                                }); },
                                registerSchemaFile: function (filePath) {
                                    schemaFiles.push(filePath);
                                },
                                getTypeReferences: function () { return pothosTypes; }
                            }
                        };
                    },
                    build: function () { return ({ config: config, schemaFiles: schemaFiles, pothosTypes: pothosTypes }); }
                };
            }
        });
        var schemaTask = taskBuilder.addTask({
            name: 'schema',
            dependencies: {},
            exports: { pothosSchema: exports.pothosSchemaProvider },
            taskDependencies: { setupTask: setupTask },
            run: function (deps, _a) {
                var _b = _a.setupTask, schemaFiles = _b.schemaFiles, pothosTypes = _b.pothosTypes;
                return {
                    getProviders: function () {
                        return {
                            pothosSchema: {
                                getImportMap: function () { return ({
                                    '%pothos': {
                                        path: '@/src/plugins/graphql/builder',
                                        allowedImports: ['builder']
                                    }
                                }); },
                                registerSchemaFile: function (filePath) {
                                    schemaFiles.push(filePath);
                                },
                                getTypeReferences: function () {
                                    return pothosTypes;
                                }
                            }
                        };
                    },
                    build: function () { return ({ schemaFiles: schemaFiles }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'main',
            dependencies: {
                node: core_generators_1.nodeProvider,
                typescript: core_generators_1.typescriptProvider,
                eslint: core_generators_1.eslintProvider,
                requestServiceContext: request_service_context_1.requestServiceContextProvider,
                prettier: core_generators_1.prettierProvider,
                rootModuleImport: root_module_1.rootModuleImportProvider,
                yogaPluginSetup: yoga_plugin_1.yogaPluginSetupProvider,
                tsUtils: core_generators_1.tsUtilsProvider
            },
            taskDependencies: { setupTask: setupTask, schemaTask: schemaTask },
            exports: {
                pothos: exports.pothosProvider
            },
            run: function (_a, _b) {
                var node = _a.node, typescript = _a.typescript, requestServiceContext = _a.requestServiceContext, prettier = _a.prettier, rootModuleImport = _a.rootModuleImport, yogaPluginSetup = _a.yogaPluginSetup, tsUtils = _a.tsUtils;
                var _c = _b.setupTask, configMap = _c.config, pothosTypes = _c.pothosTypes, schemaFiles = _b.schemaTask.schemaFiles;
                node.addPackages({
                    '@pothos/core': '3.27.0',
                    '@pothos/plugin-simple-objects': '3.6.7',
                    '@pothos/plugin-relay': '3.37.0'
                });
                // ignore prettier for schema.graphql
                prettier.addPrettierIgnore('/schema.graphql');
                return {
                    getProviders: function () {
                        return { pothos: {} };
                    },
                    build: function (builder) {
                        return __awaiter(this, void 0, void 0, function () {
                            var config, customScalars, schemaTypeOptions, DEFAULT_PLUGINS, schemaOptions, _a, builderImport, builderPath, builderFile, schemaExpression, yogaConfig;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        config = configMap.value();
                                        customScalars = pothosTypes.getCustomScalars();
                                        schemaTypeOptions = core_generators_1.TypescriptCodeUtils.mergeBlocksAsInterfaceContent(__assign({ Context: core_generators_1.TypescriptCodeUtils.createExpression("RequestServiceContext", "import { RequestServiceContext } from '%request-service-context'", { importMappers: [requestServiceContext] }), Scalars: customScalars.length
                                                ? core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(Object.fromEntries(customScalars.map(function (scalar) { return [
                                                    scalar.name,
                                                    core_generators_1.TypescriptCodeUtils.createExpression("{ Input: ".concat(scalar.inputType, ", Output: ").concat(scalar.outputType, " }")),
                                                ]; })))
                                                : undefined, DefaultEdgesNullability: 'false' }, Object.fromEntries(config.schemaTypeOptions.map(function (option) { return [
                                            option.key,
                                            option.value,
                                        ]; }))));
                                        DEFAULT_PLUGINS = [
                                            core_generators_1.TypescriptCodeUtils.createExpression("pothosFieldWithInputPayloadPlugin", "import { pothosFieldWithInputPayloadPlugin } from './FieldWithInputPayloadPlugin'"),
                                            core_generators_1.TypescriptCodeUtils.createExpression("SimpleObjectsPlugin", "import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';"),
                                            core_generators_1.TypescriptCodeUtils.createExpression("RelayPlugin", "import RelayPlugin from '@pothos/plugin-relay';"),
                                        ];
                                        schemaOptions = core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(__assign({ plugins: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsArray(__spreadArray(__spreadArray([], DEFAULT_PLUGINS, true), config.pothosPlugins, true)), relayOptions: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject({
                                                clientMutationId: "'omit'",
                                                cursorType: "'String'",
                                                edgesFieldOptions: '{ nullable: false }'
                                            }) }, Object.fromEntries(config.schemaBuilderOptions.map(function (option) { return [
                                            option.key,
                                            option.value,
                                        ]; }))));
                                        _a = (0, core_generators_1.makeImportAndFilePath)("src/plugins/graphql/builder.ts"), builderImport = _a[0], builderPath = _a[1];
                                        builderFile = typescript.createTemplate({
                                            SCHEMA_TYPE_OPTIONS: schemaTypeOptions,
                                            SCHEMA_BUILDER_OPTIONS: schemaOptions,
                                            'SUBSCRIPTION_TYPE;': new core_generators_1.TypescriptStringReplacement(yogaPluginSetup.isSubscriptionEnabled()
                                                ? "builder.subscriptionType();"
                                                : '')
                                        });
                                        return [4 /*yield*/, builder.apply(builderFile.renderToAction('builder.ts', builderPath))];
                                    case 1:
                                        _b.sent();
                                        schemaExpression = core_generators_1.TypescriptCodeUtils.createExpression("builder.toSchema()", [
                                            "import { builder } from '".concat(builderImport, "';"),
                                            "import '%root-module';",
                                        ], { importMappers: [rootModuleImport] });
                                        yogaConfig = yogaPluginSetup.getConfig();
                                        yogaConfig.set('schema', schemaExpression);
                                        yogaConfig.appendUnique('postSchemaBlocks', [
                                            core_generators_1.TypescriptCodeUtils.createBlock("if (IS_DEVELOPMENT) {\n                fs.writeFileSync(\n                  './schema.graphql',\n                  printSchema(lexicographicSortSchema(schema))\n                );\n\n                if (process.argv.includes('--exit-after-generate-schema')) {\n                  process.exit(0);\n                }\n              }", [
                                                "import { printSchema, lexicographicSortSchema } from 'graphql';",
                                                "import fs from 'fs';",
                                            ]),
                                        ]);
                                        return [4 /*yield*/, builder.apply(typescript.createCopyFilesAction({
                                                sourceBaseDirectory: 'FieldWithInputPayloadPlugin',
                                                destinationBaseDirectory: 'src/plugins/graphql/FieldWithInputPayloadPlugin',
                                                paths: [
                                                    'global-types.ts',
                                                    'index.ts',
                                                    'schema-builder.ts',
                                                    'types.ts',
                                                ],
                                                importMappers: [tsUtils]
                                            }))];
                                    case 2:
                                        _b.sent();
                                        builder.addPostWriteCommand('yarn generate:schema', {
                                            onlyIfChanged: __spreadArray(__spreadArray([], schemaFiles, true), [
                                                'src/plugins/graphql/index.ts',
                                                'src/plugins/graphql/builder.ts',
                                            ], false)
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        });
                    }
                };
            }
        });
        // split out schemagen steps to avoid cyclical dependencies
        taskBuilder.addTask({
            name: 'generate-schema',
            dependencies: {
                node: core_generators_1.nodeProvider,
                fastifyOutput: fastify_1.fastifyOutputProvider
            },
            run: function (_a) {
                var node = _a.node, fastifyOutput = _a.fastifyOutput;
                // add script to generate types
                node.addScript('generate:schema', "ts-node --transpile-only ".concat(fastifyOutput.getDevLoaderString(), " src --exit-after-generate-schema"));
                return {};
            }
        });
    }
});
exports["default"] = PothosGenerator;
