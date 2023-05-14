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
exports.requestServiceContextProvider = exports.requestServiceContextSetupProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var array_1 = require("@src/utils/array");
var request_context_1 = require("../request-context");
var service_context_1 = require("../service-context");
var descriptorSchema = zod_1.z.object({});
exports.requestServiceContextSetupProvider = (0, sync_1.createProviderType)('request-service-context-setup');
exports.requestServiceContextProvider = (0, sync_1.createProviderType)('request-service-context', {
    isReadOnly: true
});
var RequestServiceContextGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder) {
        var setupTask = taskBuilder.addTask({
            name: 'setup',
            dependencies: {
                typescript: core_generators_1.typescriptProvider,
                requestContext: request_context_1.requestContextProvider,
                serviceContextSetup: service_context_1.serviceContextSetupProvider
            },
            exports: {
                requestServiceContextSetup: exports.requestServiceContextSetupProvider
            },
            run: function (_a) {
                var _this = this;
                var typescript = _a.typescript, requestContext = _a.requestContext, serviceContextSetup = _a.serviceContextSetup;
                var contextPassthroughMap = (0, sync_1.createNonOverwriteableMap)({}, { name: 'service-context-passthrough' });
                var contextFieldsMap = (0, sync_1.createNonOverwriteableMap)({}, { name: 'request-service-context-fields' });
                contextFieldsMap.set('reqInfo', {
                    name: 'reqInfo',
                    type: requestContext.getRequestInfoType(),
                    creator: function (req) { return new core_generators_1.TypescriptCodeExpression("".concat(req, ".reqInfo")); }
                });
                var _b = (0, core_generators_1.makeImportAndFilePath)('src/utils/request-service-context.ts'), contextImport = _b[0], contextPath = _b[1];
                var importMap = {
                    '%request-service-context': {
                        path: contextImport,
                        allowedImports: [
                            'RequestServiceContext',
                            'createContextFromRequest',
                        ]
                    }
                };
                return {
                    getProviders: function () { return ({
                        requestServiceContextSetup: {
                            addContextField: function (field) {
                                contextFieldsMap.set(field.name, field);
                            },
                            addContextPassthrough: function (passthrough) {
                                contextPassthroughMap.set(passthrough.name, passthrough);
                            },
                            getImportMap: function () { return importMap; },
                            getContextPath: function () { return contextPath; }
                        }
                    }); },
                    build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                        var contextFields, contextPassthroughs, contextFile;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    contextFields = contextFieldsMap.value();
                                    contextPassthroughs = contextPassthroughMap.value();
                                    contextFile = typescript.createTemplate({
                                        CONTEXT_FIELDS: core_generators_1.TypescriptCodeUtils.mergeBlocksAsInterfaceContent(ramda_1["default"].mapObjIndexed(function (field) { return field.type; }, contextFields)),
                                        CONTEXT_BODY: core_generators_1.TypescriptCodeUtils.mergeBlocks(Object.values(contextFields)
                                            .map(function (f) { return f.body && f.body('request', 'reply'); })
                                            .filter(array_1.notEmpty)),
                                        CONTEXT_CREATOR: core_generators_1.TypescriptCodeUtils.mergeExpressions(__spreadArray([
                                            core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].mapObjIndexed(function (field) { return field.creator('request', 'reply'); }, contextPassthroughs)).wrap(function (contents) { return "...createServiceContext(".concat(contents, ")"); })
                                        ], Object.values(contextFields).map(function (field) {
                                            return field
                                                .creator('request', 'reply')
                                                .wrap(function (contents) { return "".concat(field.name, ": ").concat(contents); });
                                        }), true), ',\n').wrap(function (contents) { return "{".concat(contents, "}"); })
                                    }, {
                                        importMappers: [serviceContextSetup]
                                    });
                                    return [4 /*yield*/, builder.apply(contextFile.renderToAction('request-service-context.ts', contextPath))];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/, { importMap: importMap, contextPath: contextPath }];
                            }
                        });
                    }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'output',
            exports: {
                requestServiceContext: exports.requestServiceContextProvider
            },
            taskDependencies: { setupTask: setupTask },
            run: function (deps, _a) {
                var _this = this;
                var _b = _a.setupTask, importMap = _b.importMap, contextPath = _b.contextPath;
                return {
                    getProviders: function () { return ({
                        requestServiceContext: {
                            getImportMap: function () { return importMap; },
                            getContextPath: function () { return contextPath; }
                        }
                    }); },
                    build: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/];
                    }); }); }
                };
            }
        });
    }
});
exports["default"] = RequestServiceContextGenerator;
