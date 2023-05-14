"use strict";
// @ts-nocheck
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.PothosAuthorizeByRolesPlugin = exports.pothosAuthorizeByRolesPlugin = void 0;
/* eslint-disable class-methods-use-this */
require("./global-types");
var core_1 = require("@pothos/core");
var _http_errors_1 = require("%http-errors");
exports.pothosAuthorizeByRolesPlugin = 'authorizeByRoles';
var PothosAuthorizeByRolesPlugin = /** @class */ (function (_super) {
    __extends(PothosAuthorizeByRolesPlugin, _super);
    function PothosAuthorizeByRolesPlugin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PothosAuthorizeByRolesPlugin.prototype.onOutputFieldConfig = function (fieldConfig) {
        var _a;
        var authorize = fieldConfig.pothosOptions.authorize;
        if (!authorize &&
            ['Query', 'Mutation', 'Subscription'].includes(fieldConfig.parentType) &&
            ((_a = this.builder.options.authorizeByRoles) === null || _a === void 0 ? void 0 : _a.requireOnRootFields)) {
            throw new Error("Field \"".concat(fieldConfig.parentType, ".").concat(fieldConfig.name, "\" is missing an \"authorize\" option and all root fields require authorization."));
        }
        return fieldConfig;
    };
    PothosAuthorizeByRolesPlugin.prototype.authorizeAccess = function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorize, root, args, context, info) {
        return __awaiter(this, void 0, void 0, function () {
            var rules, roles, stringRules, ruleFunctions, results, unexpectedError, forbiddenError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rules = Array.isArray(authorize) ? authorize : [authorize];
                        roles = this.builder.options.authorizeByRoles.extractRoles(context);
                        stringRules = rules.filter(function (rule) { return typeof rule === 'string'; });
                        if (stringRules.some(function (rule) { return roles.includes(rule); })) {
                            return [2 /*return*/];
                        }
                        ruleFunctions = rules.filter(function (rule) {
                            return typeof rule === 'function';
                        });
                        return [4 /*yield*/, Promise.allSettled(ruleFunctions.map(function (func) { return func(root, args, context, info); }))];
                    case 1:
                        results = _a.sent();
                        // if any check passed, return success
                        if (results.some(function (r) { return r.status === 'fulfilled' && r.value === true; })) {
                            return [2 /*return*/];
                        }
                        unexpectedError = results.find(function (r) { return r.status === 'rejected' && !(r.reason instanceof _http_errors_1.ForbiddenError); });
                        if (unexpectedError) {
                            throw unexpectedError.reason;
                        }
                        forbiddenError = results.find(function (r) { return r.status === 'rejected' && !(r.reason instanceof _http_errors_1.ForbiddenError); });
                        if (forbiddenError) {
                            throw forbiddenError.reason;
                        }
                        throw new _http_errors_1.ForbiddenError('Forbidden');
                }
            });
        });
    };
    PothosAuthorizeByRolesPlugin.prototype.wrapResolve = function (resolver, fieldConfig) {
        var _this = this;
        var authorize = fieldConfig.pothosOptions.authorize;
        if (!authorize) {
            return resolver;
        }
        return function (source, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.authorizeAccess(authorize, source, args, context, info)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, resolver(source, args, context, info)];
                }
            });
        }); };
    };
    PothosAuthorizeByRolesPlugin.prototype.wrapSubscribe = function (subscriber, fieldConfig) {
        var _this = this;
        var authorize = fieldConfig.pothosOptions.authorize;
        if (!authorize) {
            return subscriber;
        }
        return function (source, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.authorizeAccess(authorize, source, args, context, info)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, subscriber(source, args, context, info)];
                }
            });
        }); };
    };
    return PothosAuthorizeByRolesPlugin;
}(core_1.BasePlugin));
exports.PothosAuthorizeByRolesPlugin = PothosAuthorizeByRolesPlugin;
core_1["default"].registerPlugin(exports.pothosAuthorizeByRolesPlugin, PothosAuthorizeByRolesPlugin);
