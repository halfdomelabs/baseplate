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
exports.authRolesProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var prisma_1 = require("@src/generators/prisma/prisma");
var auth_service_1 = require("../auth-service");
var role_service_1 = require("../role-service");
var descriptorSchema = zod_1.z.object({
    userRoleModelName: zod_1.z.string().min(1)
});
exports.authRolesProvider = (0, sync_1.createProviderType)('auth-roles');
var AuthRolesGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        authInfo: auth_service_1.authInfoProvider,
        roleService: role_service_1.roleServiceProvider,
        prismaOutput: prisma_1.prismaOutputProvider
    },
    exports: {
        authRoles: exports.authRolesProvider
    },
    createGenerator: function (_a, _b) {
        var _this = this;
        var userRoleModelName = _a.userRoleModelName;
        var authInfo = _b.authInfo, prismaOutput = _b.prismaOutput, roleService = _b.roleService;
        var authRolesType = core_generators_1.TypescriptCodeUtils.createExpression("AuthRole[]", "import {AuthRole} from '%role-service'", { importMappers: [roleService] });
        var rolesCreatorBody = core_generators_1.TypescriptCodeUtils.formatBlock("const userRoles = await USER_ROLE_MODEL.findMany({\n        where: { userId: user.id },\n      });\n      \n      const roles = ROLES_SERVICE.populateAuthRoles(userRoles.map(r => r.role));", {
            USER_ROLE_MODEL: prismaOutput.getPrismaModelExpression(userRoleModelName),
            ROLES_SERVICE: roleService.getServiceExpression()
        });
        authInfo.registerAuthField({
            key: 'roles',
            creatorBody: rolesCreatorBody,
            extraCreateArgs: [{ name: 'roles', type: authRolesType }],
            value: core_generators_1.TypescriptCodeUtils.createExpression('roles'),
            type: authRolesType
        });
        authInfo.registerAuthField({
            key: 'hasSomeRole',
            value: new core_generators_1.TypescriptCodeExpression('(possibleRoles) => roles.some((role) => possibleRoles.includes(role))'),
            type: core_generators_1.TypescriptCodeUtils.createExpression("(possibleRoles: AuthRole[]) => boolean", "import {AuthRole} from '%role-service'", { importMappers: [roleService] })
        });
        authInfo.registerAuthField({
            key: 'hasRole',
            value: new core_generators_1.TypescriptCodeExpression('(role) => roles.includes(role)'),
            type: core_generators_1.TypescriptCodeUtils.createExpression("(role: AuthRole) => boolean", "import {AuthRole} from '%role-service'", { importMappers: [roleService] })
        });
        return {
            getProviders: function () { return ({
                authRoles: {}
            }); },
            build: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); }
        };
    }
});
exports["default"] = AuthRolesGenerator;
