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
exports.configServiceProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var fastify_1 = require("../fastify");
var descriptorSchema = zod_1.z.object({
    placeholder: zod_1.z.string().optional()
});
exports.configServiceProvider = (0, sync_1.createProviderType)('config-service');
var ConfigServiceGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder) {
        taskBuilder.addTask({
            name: 'fastify',
            dependencies: {
                fastify: fastify_1.fastifyProvider
            },
            run: function (_a) {
                var fastify = _a.fastify;
                fastify.getConfig().appendUnique('devLoaders', ['dotenv/config']);
                return {};
            }
        });
        taskBuilder.addTask({
            name: 'main',
            dependencies: {
                node: core_generators_1.nodeProvider,
                nodeGitIgnore: core_generators_1.nodeGitIgnoreProvider,
                typescript: core_generators_1.typescriptProvider
            },
            exports: { configService: exports.configServiceProvider },
            run: function (_a) {
                var _this = this;
                var node = _a.node, nodeGitIgnore = _a.nodeGitIgnore, typescript = _a.typescript;
                var configEntries = (0, sync_1.createNonOverwriteableMap)({}, { name: 'config-service-config-entries' });
                var additionalVerifications = [];
                node.addPackages({
                    zod: '3.20.6'
                });
                node.addDevPackages({
                    dotenv: '^10.0.0'
                });
                nodeGitIgnore.addExclusions(['/.env', '/.*.env']);
                configEntries.set('APP_ENVIRONMENT', {
                    comment: 'Environment the app is running in',
                    value: core_generators_1.TypescriptCodeUtils.createExpression("z.enum(['development', 'test', 'staging', 'production'])", "import { z } from 'zod'"),
                    exampleValue: 'development'
                });
                return {
                    getProviders: function () { return ({
                        configService: {
                            getConfigEntries: function () { return configEntries; },
                            addAdditionalVerification: function (codeBlock) {
                                additionalVerifications.push(codeBlock);
                            },
                            getConfigExpression: function () {
                                return core_generators_1.TypescriptCodeUtils.createExpression('config', "import { config } from '@/src/services/config'");
                            },
                            getImportMap: function () { return ({
                                '%config': {
                                    path: '@/src/services/config',
                                    allowedImports: ['config']
                                }
                            }); }
                        }
                    }); },
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        var configFile, configEntriesObj, sortedConfigEntries, configEntryKeys, mergedExpression, envExampleFile, envFile;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    configFile = typescript.createTemplate({
                                        CONFIG_OBJECT: { type: 'code-expression' },
                                        ADDITIONAL_VERIFICATIONS: { type: 'code-block' }
                                    });
                                    configEntriesObj = configEntries.value();
                                    sortedConfigEntries = ramda_1["default"].sortBy(function (entry) { return entry[0]; }, Object.entries(configEntriesObj));
                                    configEntryKeys = Object.keys(configEntriesObj).sort();
                                    mergedExpression = configEntryKeys
                                        .map(function (key) {
                                        var _a = configEntriesObj[key], comment = _a.comment, value = _a.value;
                                        return "".concat(comment
                                            ? "".concat(core_generators_1.TypescriptCodeUtils.formatAsComment(comment), "\n")
                                            : '').concat(key, ": ").concat(typeof value === 'string' ? value : value.content, ",");
                                    })
                                        .join('\n');
                                    configFile.addCodeExpression('CONFIG_OBJECT', new core_generators_1.TypescriptCodeExpression("{\n".concat(mergedExpression, "\n}"), null, (0, core_generators_1.mergeCodeEntryOptions)(Object.values(configEntriesObj).map(function (e) { return e.value; }))));
                                    configFile.addCodeBlock('ADDITIONAL_VERIFICATIONS', core_generators_1.TypescriptCodeUtils.mergeBlocks(additionalVerifications));
                                    return [4 /*yield*/, builder.apply(configFile.renderToAction('config.ts', 'src/services/config.ts'))];
                                case 1:
                                    _a.sent();
                                    envExampleFile = "".concat(sortedConfigEntries
                                        .filter(function (_a) {
                                        var exampleValue = _a[1].exampleValue;
                                        return exampleValue != null;
                                    })
                                        .map(function (_a) {
                                        var key = _a[0], exampleValue = _a[1].exampleValue;
                                        return "".concat(key, "=").concat(exampleValue);
                                    })
                                        .join('\n'), "\n");
                                    envFile = "".concat(sortedConfigEntries
                                        .filter(function (_a) {
                                        var _b = _a[1], seedValue = _b.seedValue, exampleValue = _b.exampleValue;
                                        return (seedValue || exampleValue) != null;
                                    })
                                        .map(function (_a) {
                                        var _b;
                                        var key = _a[0], _c = _a[1], seedValue = _c.seedValue, exampleValue = _c.exampleValue;
                                        return "".concat(key, "=").concat((_b = seedValue !== null && seedValue !== void 0 ? seedValue : exampleValue) !== null && _b !== void 0 ? _b : '');
                                    })
                                        .join('\n'), "\n");
                                    builder.writeFile('.env.example', envExampleFile);
                                    builder.writeFile('.env', envFile, {
                                        neverOverwrite: true
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); }
                };
            }
        });
    }
});
exports["default"] = ConfigServiceGenerator;
