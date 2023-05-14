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
exports.roleServiceProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var root_module_1 = require("@src/generators/core/root-module");
var service_file_1 = require("@src/generators/core/service-file");
var auth_1 = require("../auth");
/**
 * UserRole schema:
 *
 * userId: string
 * role: string
 *
 * User table:
 *
 * roles: UserRole[]
 */
var descriptorSchema = zod_1.z.object({
    // Note: Anonymous and user roles are automatically added
    roles: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        comment: zod_1.z.string().min(1),
        inherits: zod_1.z.array(zod_1.z.string().min(1)).optional()
    }))
        .optional()
});
exports.roleServiceProvider = (0, sync_1.createProviderType)('role-service');
var RoleServiceGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        typescript: core_generators_1.typescriptProvider,
        appModule: root_module_1.appModuleProvider,
        serviceFile: service_file_1.serviceFileProvider,
        authSetup: auth_1.authSetupProvider
    },
    exports: {
        roleService: exports.roleServiceProvider
    },
    createGenerator: function (_a, _b) {
        var _this = this;
        var _c = _a.roles, roles = _c === void 0 ? [] : _c;
        var serviceFile = _b.serviceFile, appModule = _b.appModule, authSetup = _b.authSetup;
        var customHeaderBlocks = [];
        var headerBlock = new core_generators_1.TypescriptSourceBlock({
            HEADER: { type: 'code-block' },
            USER: {
                type: 'code-expression'
            },
            USER_ROLE: { type: 'code-expression' },
            AVAILABLE_ROLES_EXPORT: { type: 'code-block' },
            ROLE_MAP: { type: 'code-expression' }
        });
        if (!['anonymous', 'user'].every(function (name) { return roles.some(function (r) { return r.name === name; }); })) {
            throw new Error('Anonymous and user roles are required to be added');
        }
        headerBlock.addCodeEntries({
            AVAILABLE_ROLES_EXPORT: "export type AuthRole = ".concat(roles
                .map(function (_a) {
                var name = _a.name;
                return "'".concat(name, "'");
            })
                .join(' | ')),
            ROLE_MAP: JSON.stringify(ramda_1["default"].mergeAll(roles.map(function (_a) {
                var _b;
                var name = _a.name, comment = _a.comment, inherits = _a.inherits;
                return (_b = {},
                    _b[name] = {
                        comment: comment,
                        inherits: inherits
                    },
                    _b);
            })))
        });
        var roleServiceImport = {
            path: serviceFile.getServiceImport(),
            allowedImports: [
                'AUTH_ROLE_CONFIG',
                'AuthRole',
                serviceFile.getServiceName(),
            ]
        };
        authSetup.getConfig().set('roleServiceImport', roleServiceImport);
        return {
            getProviders: function () { return ({
                roleService: {
                    getImportMap: function () { return ({
                        '%role-service': roleServiceImport
                    }); },
                    addHeaderBlock: function (block) {
                        customHeaderBlocks.push(block);
                    },
                    getServiceExpression: function () { return serviceFile.getServiceExpression(); },
                    getServiceImport: function () { return serviceFile.getServiceImport(); }
                }
            }); },
            build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                var template;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            builder.setBaseDirectory(appModule.getModuleFolder());
                            return [4 /*yield*/, builder.readTemplate('services/auth-role-service.ts')];
                        case 1:
                            template = _a.sent();
                            headerBlock.addCodeEntries({ HEADER: customHeaderBlocks });
                            serviceFile.registerMethod('populateAuthRoles', core_generators_1.TypescriptCodeUtils.createExpression(core_generators_1.TypescriptCodeUtils.extractTemplateSnippet(template, 'BODY'), undefined, {
                                headerBlocks: [
                                    headerBlock.renderToBlock(core_generators_1.TypescriptCodeUtils.extractTemplateSnippet(template, 'HEADER')),
                                ]
                            }));
                            return [2 /*return*/];
                    }
                });
            }); }
        };
    }
});
exports["default"] = RoleServiceGenerator;
