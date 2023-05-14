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
exports.appModuleProvider = exports.rootModuleImportProvider = exports.rootModuleProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var descriptorSchema = zod_1.z.object({
    placeholder: zod_1.z.string().optional()
});
exports.rootModuleProvider = (0, sync_1.createProviderType)('root-module');
exports.rootModuleImportProvider = (0, sync_1.createProviderType)('root-module-import', {
    isReadOnly: true
});
exports.appModuleProvider = (0, sync_1.createProviderType)('app-module');
var RootModuleGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder) {
        var rootModuleTask = taskBuilder.addTask({
            name: 'rootModule',
            exports: {
                rootModule: exports.rootModuleProvider
            },
            run: function () {
                var moduleFieldMap = (0, sync_1.createNonOverwriteableMap)({}, { name: 'root-module-fields' });
                return {
                    getProviders: function () {
                        return {
                            rootModule: {
                                addModuleField: function (name, type) {
                                    moduleFieldMap.set(name, type);
                                },
                                getRootModule: function () {
                                    return core_generators_1.TypescriptCodeUtils.createExpression('RootModule', "import { RootModule } from '@/src/modules'");
                                }
                            }
                        };
                    },
                    build: function () { return ({ moduleFieldMap: moduleFieldMap }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'rootModuleImport',
            exports: { rootModuleImport: exports.rootModuleImportProvider },
            run: function () {
                return {
                    getProviders: function () {
                        return {
                            rootModuleImport: {
                                getRootModule: function () {
                                    return core_generators_1.TypescriptCodeUtils.createExpression('RootModule', "import { RootModule } from '@/src/modules'");
                                },
                                getRootModuleImport: function () { return "@/src/modules"; },
                                getImportMap: function () { return ({
                                    '%root-module': {
                                        path: '@/src/modules',
                                        allowedImports: ['RootModule']
                                    }
                                }); }
                            }
                        };
                    }
                };
            }
        });
        taskBuilder.addTask({
            name: 'appModule',
            dependencies: { typescript: core_generators_1.typescriptProvider },
            exports: { appModule: exports.appModuleProvider },
            taskDependencies: { rootModuleTask: rootModuleTask },
            run: function (_a, _b) {
                var _this = this;
                var typescript = _a.typescript;
                var moduleFieldMap = _b.rootModuleTask.moduleFieldMap;
                var rootModuleEntries = (0, sync_1.createNonOverwriteableMap)({}, { name: 'root-module-entries' });
                var moduleImports = [];
                return {
                    getProviders: function () { return ({
                        appModule: {
                            getModuleFolder: function () { return 'src/modules'; },
                            getValidFields: function () { return __spreadArray([
                                'children'
                            ], Object.keys(moduleFieldMap.value()), true); },
                            addModuleImport: function (name) {
                                moduleImports.push(name);
                            },
                            registerFieldEntry: function (name, type) {
                                if (name !== 'children' && !moduleFieldMap.get(name)) {
                                    throw new Error("Unknown field entry: ".concat(name));
                                }
                                rootModuleEntries.appendUnique(name, [type]);
                            }
                        }
                    }); },
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        var rootModule, moduleHelper, moduleFields, mergers;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    rootModule = typescript.createTemplate({
                                        ROOT_MODULE_CONTENTS: { type: 'code-expression' }
                                    });
                                    rootModule.addCodeExpression('ROOT_MODULE_CONTENTS', core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].mapObjIndexed(function (types) { return core_generators_1.TypescriptCodeUtils.mergeExpressionsAsArray(types); }, rootModuleEntries.value())));
                                    return [4 /*yield*/, builder.apply(rootModule.renderToAction('index.ts', 'src/modules/index.ts'))];
                                case 1:
                                    _a.sent();
                                    moduleHelper = typescript.createTemplate({
                                        MODULE_FIELDS: { type: 'code-block' },
                                        MODULE_MERGER: { type: 'code-expression' }
                                    });
                                    moduleFields = Object.keys(moduleFieldMap.value()).map(function (name) {
                                        var field = moduleFieldMap.get(name);
                                        return { name: name, field: field };
                                    });
                                    moduleHelper.addCodeAddition({
                                        importText: moduleImports.map(function (name) { return "import '".concat(name, "'"); })
                                    });
                                    moduleHelper.addCodeBlock('MODULE_FIELDS', core_generators_1.TypescriptCodeUtils.mergeBlocks(moduleFields.map(function (_a) {
                                        var name = _a.name, field = _a.field;
                                        var wrapper = core_generators_1.TypescriptCodeUtils.createWrapper(function (contents) { return "".concat(name, "?: ").concat(contents, "[]"); });
                                        return core_generators_1.TypescriptCodeUtils.toBlock(core_generators_1.TypescriptCodeUtils.wrapExpression(field, wrapper));
                                    })));
                                    mergers = ramda_1["default"].mergeAll(moduleFields.map(function (_a) {
                                        var _b;
                                        var name = _a.name;
                                        return (_b = {},
                                            _b[name] = core_generators_1.TypescriptCodeUtils.createExpression("[...(prev.".concat(name, " || []), ...(current.").concat(name, " || [])]")),
                                            _b);
                                    }));
                                    moduleHelper.addCodeExpression('MODULE_MERGER', core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(mergers, {
                                        wrapWithParenthesis: true
                                    }));
                                    return [4 /*yield*/, builder.apply(moduleHelper.renderToAction('app-modules.ts', 'src/utils/app-modules.ts'))];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }
                };
            }
        });
    }
});
exports["default"] = RootModuleGenerator;
