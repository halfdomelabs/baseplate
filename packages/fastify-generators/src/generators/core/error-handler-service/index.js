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
exports.errorHandlerServiceProvider = exports.errorHandlerServiceSetupProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var config_service_1 = require("../config-service");
var fastify_server_1 = require("../fastify-server");
var logger_service_1 = require("../logger-service");
var descriptorSchema = zod_1.z.object({});
var errorHandlerFileConfig = (0, core_generators_1.createTypescriptTemplateConfig)({
    HEADER: { type: 'code-block' },
    LOGGER_ACTIONS: { type: 'code-block' }
});
var ERROR_MAP = {
    http: 'HttpError',
    badRequest: 'BadRequestError',
    unauthorized: 'UnauthorizedError',
    forbidden: 'ForbiddenError',
    notFound: 'NotFoundError'
};
exports.errorHandlerServiceSetupProvider = (0, sync_1.createProviderType)('error-handler-service-setup');
exports.errorHandlerServiceProvider = (0, sync_1.createProviderType)('error-handler-service', {
    isReadOnly: true
});
var ErrorHandlerServiceGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        loggerService: logger_service_1.loggerServiceProvider,
        fastifyServer: fastify_server_1.fastifyServerProvider,
        typescript: core_generators_1.typescriptProvider,
        configService: config_service_1.configServiceProvider
    },
    exports: {
        errorHandlerServiceSetup: exports.errorHandlerServiceSetupProvider,
        errorHandlerService: exports.errorHandlerServiceProvider
    },
    createGenerator: function (descriptor, _a) {
        var _this = this;
        var loggerService = _a.loggerService, fastifyServer = _a.fastifyServer, typescript = _a.typescript, configService = _a.configService;
        var errorLoggerFile = typescript.createTemplate(errorHandlerFileConfig);
        fastifyServer.registerPlugin({
            name: 'errorHandlerPlugin',
            plugin: core_generators_1.TypescriptCodeUtils.createExpression('errorHandlerPlugin', "import { errorHandlerPlugin } from '@/src/plugins/error-handler'"),
            orderPriority: 'EARLY'
        });
        var errorFunction = core_generators_1.TypescriptCodeUtils.createExpression('logError', "import { logError } from '@/src/services/error-logger'");
        fastifyServer.getConfig().set('errorHandlerFunction', errorFunction);
        var importMap = {
            '%http-errors': {
                path: "@/src/utils/http-errors",
                allowedImports: Object.values(ERROR_MAP)
            },
            '%error-logger': {
                path: '@/src/services/error-logger',
                allowedImports: ['logError']
            }
        };
        return {
            getProviders: function () { return ({
                errorHandlerServiceSetup: {
                    getHandlerFile: function () { return errorLoggerFile; },
                    getImportMap: function () { return importMap; },
                    getErrorFunction: function () { return errorFunction; },
                    getHttpErrorsImport: function () { return '@/src/utils/http-errors'; }
                },
                errorHandlerService: {
                    getErrorFunction: function () { return errorFunction; },
                    getHttpErrorsImport: function () { return '@/src/utils/http-errors'; },
                    getHttpErrorExpression: function (error) {
                        return new core_generators_1.TypescriptCodeExpression(ERROR_MAP[error], "import { ".concat(ERROR_MAP[error], " } from '@/src/utils/http-errors'"));
                    },
                    getImportMap: function () { return importMap; }
                }
            }); },
            build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            errorLoggerFile.addCodeBlock('LOGGER_ACTIONS', core_generators_1.TypescriptCodeUtils.toBlock(core_generators_1.TypescriptCodeUtils.wrapExpression(loggerService.getLogger(), function (code) { return "".concat(code, ".error(error);"); })));
                            return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                    source: 'plugins/error-handler.ts',
                                    destination: 'src/plugins/error-handler.ts',
                                    importMappers: [configService]
                                }))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, builder.apply(errorLoggerFile.renderToAction('services/error-logger.ts', 'src/services/error-logger.ts'))];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, builder.apply((0, sync_1.copyFileAction)({
                                    source: 'utils/http-errors.ts',
                                    destination: 'src/utils/http-errors.ts',
                                    shouldFormat: true
                                }))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        };
    }
});
exports["default"] = ErrorHandlerServiceGenerator;
