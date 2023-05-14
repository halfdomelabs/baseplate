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
exports.serviceContextProvider = exports.serviceContextSetupProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var descriptorSchema = zod_1.z.object({
    placeholder: zod_1.z.string().optional()
});
exports.serviceContextSetupProvider = (0, sync_1.createProviderType)('service-context-setup');
exports.serviceContextProvider = (0, sync_1.createProviderType)('service-context');
var ServiceContextGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder) {
        var setupTask = taskBuilder.addTask({
            name: 'setup',
            dependencies: {
                typescript: core_generators_1.typescriptProvider
            },
            exports: {
                serviceContextSetup: exports.serviceContextSetupProvider
            },
            run: function (_a) {
                var _this = this;
                var typescript = _a.typescript;
                var contextFieldsMap = (0, sync_1.createNonOverwriteableMap)({}, { name: 'service-context-fields' });
                var _b = (0, core_generators_1.makeImportAndFilePath)('src/utils/service-context.ts'), contextImport = _b[0], contextPath = _b[1];
                var _c = (0, core_generators_1.makeImportAndFilePath)('src/tests/helpers/service-context.test-helper.ts'), testHelperImport = _c[0], testHelperPath = _c[1];
                var importMap = {
                    '%service-context': {
                        path: contextImport,
                        allowedImports: ['ServiceContext', 'createServiceContext']
                    },
                    '%service-context/test': {
                        path: testHelperImport,
                        allowedImports: ['createTestServiceContext']
                    }
                };
                return {
                    getProviders: function () { return ({
                        serviceContextSetup: {
                            addContextField: function (name, config) {
                                contextFieldsMap.set(name, config);
                            },
                            getImportMap: function () { return importMap; },
                            getContextPath: function () { return contextPath; }
                        }
                    }); },
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        var contextFields, contextArgs, contextFile, testHelperFile;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    contextFields = contextFieldsMap.value();
                                    contextArgs = Object.values(contextFields).flatMap(function (f) { return f.contextArg || []; });
                                    contextFile = typescript.createTemplate({
                                        CONTEXT_FIELDS: core_generators_1.TypescriptCodeUtils.mergeBlocksAsInterfaceContent(ramda_1["default"].mapObjIndexed(function (field) { return field.type; }, contextFields)),
                                        CREATE_CONTEXT_ARGS: core_generators_1.TypescriptCodeUtils.mergeExpressions(contextArgs.map(function (arg) {
                                            return arg.type.wrap(function (contents) { return "".concat(arg.name, ": ").concat(contents); });
                                        }), '; ').wrap(function (contents) { return "\n            {".concat(contextArgs.map(function (a) { return a.name; }).join(', '), "}: {").concat(contents, "}\n          "); }),
                                        CONTEXT_OBJECT: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].mapObjIndexed(function (field) { return field.value; }, contextFields))
                                    });
                                    return [4 /*yield*/, builder.apply(contextFile.renderToAction('service-context.ts', contextPath))];
                                case 1:
                                    _a.sent();
                                    testHelperFile = typescript.createTemplate({
                                        TEST_ARGS: core_generators_1.TypescriptCodeUtils.mergeExpressions(contextArgs.map(function (arg) {
                                            return arg.type.wrap(function (contents) {
                                                return "".concat(arg.name).concat(arg.testDefault ? '?' : '', ": ").concat(contents);
                                            });
                                        }), '; ').wrap(function (contents) { return "\n            {".concat(contextArgs.map(function (a) { return a.name; }).join(', '), "}: {").concat(contents, "} = {}\n          "); }),
                                        TEST_OBJECT: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].fromPairs(contextArgs.map(function (arg) { return [
                                            arg.name,
                                            arg.testDefault
                                                ? arg.testDefault.prepend("".concat(arg.name, " ?? "))
                                                : core_generators_1.TypescriptCodeUtils.createExpression(arg.name),
                                        ]; })))
                                    }, { importMappers: [{ getImportMap: function () { return importMap; } }] });
                                    return [4 /*yield*/, builder.apply(testHelperFile.renderToAction('service-context.test-helper.ts', testHelperPath))];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/, { importMap: importMap, contextPath: contextPath, contextImport: contextImport }];
                            }
                        });
                    }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'main',
            taskDependencies: { setupTask: setupTask },
            exports: { serviceContext: exports.serviceContextProvider },
            run: function (deps, _a) {
                var _b = _a.setupTask, importMap = _b.importMap, contextPath = _b.contextPath, contextImport = _b.contextImport;
                return {
                    getProviders: function () { return ({
                        serviceContext: {
                            getImportMap: function () { return importMap; },
                            getContextPath: function () { return contextPath; },
                            getServiceContextType: function () {
                                return core_generators_1.TypescriptCodeUtils.createExpression('ServiceContext', "import {ServiceContext} from '".concat(contextImport, "'"));
                            }
                        }
                    }); }
                };
            }
        });
    }
});
exports["default"] = ServiceContextGenerator;
