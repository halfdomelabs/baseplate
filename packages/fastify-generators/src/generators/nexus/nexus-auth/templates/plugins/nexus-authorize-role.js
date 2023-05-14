"use strict";
// @ts-nocheck
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
exports.fieldAuthorizeRolePlugin = void 0;
var nexus_1 = require("nexus");
var utils_1 = require("nexus/dist/utils");
var _http_errors_1 = require("%http-errors");
// adapted from FieldAuthorizePlugin.ts in Nexus
var FieldAuthorizeRoleResolverImport = (0, utils_1.printedGenTypingImport)({
    module: MODULE_FILE,
    bindings: ['FieldAuthorizeRoleResolver']
});
var fieldDefTypes = (0, utils_1.printedGenTyping)({
    optional: true,
    name: 'authorize',
    description: 'Authorization rules for an individual field',
    type: 'FieldAuthorizeRoleResolver<TypeName, FieldName>',
    imports: [FieldAuthorizeRoleResolverImport]
});
var fieldAuthorizeRolePlugin = function (authorizeConfig) {
    if (authorizeConfig === void 0) { authorizeConfig = {}; }
    var requireOnRootFields = authorizeConfig.requireOnRootFields;
    function authorizeAccess(authorize, root, args, context, info) {
        return __awaiter(this, void 0, void 0, function () {
            var rules, ruleFunctions, results, unexpectedError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rules = Array.isArray(authorize) ? authorize : [authorize];
                        ruleFunctions = rules.map(function (rule) {
                            if (typeof rule === 'function') {
                                return rule;
                            }
                            return function () { return context.auth.roles.includes(rule); };
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
                        throw new _http_errors_1.ForbiddenError('Forbidden');
                }
            });
        });
    }
    return (0, nexus_1.plugin)({
        name: 'AuthorizeRole',
        description: 'Plugin provides field-level authorization by role or function',
        fieldDefTypes: fieldDefTypes,
        onCreateFieldResolver: function (config) {
            var _this = this;
            var _a, _b;
            var authorize = (_b = (_a = config.fieldConfig.extensions) === null || _a === void 0 ? void 0 : _a.nexus) === null || _b === void 0 ? void 0 : _b.config.authorize;
            // skip if authorize
            if (authorize == null) {
                if (requireOnRootFields &&
                    ['Query', 'Mutation', 'Subscription'].includes(config.parentTypeConfig.name)) {
                    throw new Error("Authorize configuration required on root-field ".concat(config.fieldConfig.name));
                }
                return undefined;
            }
            return function (root, args, ctx, info, next) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, authorizeAccess(authorize, root, args, ctx, info)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, next(root, args, ctx, info)];
                    }
                });
            }); };
        },
        onAddOutputField: function (field) {
            var authorize = field.authorize, subscribe = field.subscribe;
            // due to onFieldCreateSubscribe not being implemented (https://github.com/graphql-nexus/nexus/issues/868)
            // we need to manually patch subscribe field config
            if (subscribe && authorize) {
                // eslint-disable-next-line no-param-reassign
                field.subscribe = function authorizeSubscribe(root, args, context, info) {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, authorizeAccess(authorize, root, args, context, info)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/, subscribe(root, args, context, info)];
                            }
                        });
                    });
                };
            }
        }
    });
};
exports.fieldAuthorizeRolePlugin = fieldAuthorizeRolePlugin;
