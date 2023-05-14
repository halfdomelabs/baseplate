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
exports.ServiceFileGenerator = exports.serviceFileOutputProvider = exports.serviceFileProvider = void 0;
var path_1 = require("path");
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var change_case_1 = require("change-case");
var zod_1 = require("zod");
var array_1 = require("@src/utils/array");
var case_1 = require("@src/utils/case");
var root_module_1 = require("../root-module");
var descriptorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    methodOrder: zod_1.z.array(zod_1.z.string()).optional()
});
exports.serviceFileProvider = (0, sync_1.createProviderType)('service-file');
exports.serviceFileOutputProvider = (0, sync_1.createProviderType)('service-file-output');
exports.ServiceFileGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        var mainTask = taskBuilder.addTask({
            name: 'main',
            dependencies: {
                appModule: root_module_1.appModuleProvider,
                typescript: core_generators_1.typescriptProvider
            },
            exports: { serviceFile: exports.serviceFileProvider },
            run: function (_a) {
                var _this = this;
                var appModule = _a.appModule, typescript = _a.typescript;
                var methodMap = (0, sync_1.createNonOverwriteableMap)({}, { name: 'prisma-crud-service-method-map' });
                var outputMap = (0, sync_1.createNonOverwriteableMap)({}, { name: 'prisma-crud-service-output-map' });
                var servicesFolder = path_1["default"].join(appModule.getModuleFolder(), 'services');
                var servicesImport = path_1["default"].join(servicesFolder, "".concat((0, change_case_1.paramCase)(descriptor.name)));
                var servicesPath = "".concat(servicesImport, ".ts");
                var servicesFile = typescript.createTemplate({
                    METHODS: { type: 'code-expression' },
                    SERVICE_NAME: { type: 'code-expression' }
                });
                var serviceName = (0, case_1.lowerCaseFirst)(descriptor.name);
                return {
                    getProviders: function () { return ({
                        serviceFile: {
                            getServiceImport: function () { return "@/".concat(servicesImport); },
                            getServiceExpression: function () {
                                return new core_generators_1.TypescriptCodeExpression(serviceName, "import { ".concat(serviceName, " } from '@/").concat(servicesImport, "';"));
                            },
                            getServiceName: function () { return serviceName; },
                            registerMethod: function (key, expression, outputMethod) {
                                methodMap.set(key, expression);
                                if (outputMethod) {
                                    outputMap.set(key, outputMethod);
                                }
                            }
                        }
                    }); },
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        var methods, methodOrder, orderedMethods;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    methods = methodMap.value();
                                    methodOrder = descriptor.methodOrder || [];
                                    orderedMethods = __spreadArray(__spreadArray([], methodOrder.map(function (key) { return methods[key]; }).filter(array_1.notEmpty), true), Object.keys(methods)
                                        .filter(function (m) { return !methodOrder.includes(m); })
                                        .map(function (key) { return methods[key]; }), true);
                                    servicesFile.addCodeEntries({
                                        SERVICE_NAME: serviceName,
                                        METHODS: core_generators_1.TypescriptCodeUtils.mergeExpressions(orderedMethods, ',\n\n').wrap(function (c) { return "{".concat(c, "}"); })
                                    });
                                    if (!Object.keys(methodMap.value()).length) return [3 /*break*/, 2];
                                    return [4 /*yield*/, builder.apply(servicesFile.renderToActionFromText('export const SERVICE_NAME = METHODS;', servicesPath))];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/, { outputMap: outputMap }];
                            }
                        });
                    }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'output',
            exports: { serviceFileOutput: exports.serviceFileOutputProvider },
            taskDependencies: { mainTask: mainTask },
            run: function (deps, _a) {
                var outputMap = _a.mainTask.outputMap;
                return {
                    getProviders: function () { return ({
                        serviceFileOutput: {
                            getServiceMethod: function (key) {
                                var output = outputMap.get(key);
                                if (!output) {
                                    throw new Error("No output method found for key ".concat(key));
                                }
                                return output;
                            }
                        }
                    }); }
                };
            }
        });
    }
});
exports["default"] = exports.ServiceFileGenerator;
