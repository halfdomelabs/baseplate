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
exports.nexusAuthProvider = exports.authorizeConfigSchema = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var auth_1 = require("@src/generators/auth/auth");
var error_handler_service_1 = require("@src/generators/core/error-handler-service");
var request_service_context_1 = require("@src/generators/core/request-service-context");
var nexus_1 = require("../nexus");
var descriptorSchema = zod_1.z.object({
    requireOnRootFields: zod_1.z.boolean()["default"](true)
});
exports.authorizeConfigSchema = zod_1.z.object({
    roles: zod_1.z.array(zod_1.z.string().min(1))
});
exports.nexusAuthProvider = (0, sync_1.createProviderType)('nexus-auth', { isReadOnly: true });
var NexusAuthGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        nexusSetup: nexus_1.nexusSetupProvider,
        requestServiceContextSetup: request_service_context_1.requestServiceContextSetupProvider,
        auth: auth_1.authProvider,
        errorHandlerService: error_handler_service_1.errorHandlerServiceProvider,
        typescript: core_generators_1.typescriptProvider
    },
    exports: {
        nexusAuth: exports.nexusAuthProvider
    },
    createGenerator: function (_a, _b) {
        var _this = this;
        var requireOnRootFields = _a.requireOnRootFields;
        var nexusSetup = _b.nexusSetup, errorHandlerService = _b.errorHandlerService, typescript = _b.typescript, auth = _b.auth, requestServiceContextSetup = _b.requestServiceContextSetup;
        var nexusAuthorizePluginFile = typescript.createTemplate({
            MODULE_FILE: { type: 'code-expression' }
        }, {
            importMappers: [
                auth,
                errorHandlerService,
                nexusSetup,
                requestServiceContextSetup,
            ]
        });
        // TODO: Figure out how to resolve this properly
        nexusAuthorizePluginFile.addCodeEntries({
            MODULE_FILE: "'@src/plugins/graphql/nexus-authorize-role'"
        });
        nexusSetup.registerSchemaFile("'@src/plugins/graphql/nexus-authorize-role.ts");
        var args = requireOnRootFields
            ? JSON.stringify({ requireOnRootFields: true })
            : '';
        nexusSetup
            .getConfig()
            .appendUnique('nexusPlugins', [
            core_generators_1.TypescriptCodeUtils.createExpression("fieldAuthorizeRolePlugin(".concat(args, ")"), "import { fieldAuthorizeRolePlugin } from '@/src/plugins/graphql/nexus-authorize-role';"),
        ])
            .appendUnique('mutationFields', [
            {
                name: 'authorize',
                isOptional: true,
                type: new core_generators_1.TypescriptCodeExpression("FieldAuthorizeRoleResolver<'Mutation', FieldName>", "import { FieldAuthorizeRoleResolver } from '@/src/plugins/graphql/nexus-authorize-role';")
            },
        ]);
        return {
            getProviders: function () { return ({
                nexusAuth: {
                    formatAuthorizeConfig: function (config) {
                        // TODO: Validate roles
                        return core_generators_1.TypescriptCodeUtils.createExpression(JSON.stringify(config.roles));
                    }
                }
            }); },
            build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, builder.apply(nexusAuthorizePluginFile.renderToAction('plugins/nexus-authorize-role.ts', 'src/plugins/graphql/nexus-authorize-role.ts'))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        };
    }
});
exports["default"] = NexusAuthGenerator;
