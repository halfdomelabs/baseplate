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
exports.createAuthInfoFromAuthorization = exports.createAuthInfoFromRequest = exports.getUserInfoFromRequest = void 0;
var auth_info_1 = require("../utils/auth-info");
var USER_ID_CLAIM = 'https://app.com/user_id';
var EMAIL_CLAIM = 'https://app.com/email';
var EMAIL_VERIFIED_CLAIM = 'https://app.com/email_verified';
var ROLES_CLAIM = 'https://app.com/roles';
function getUserInfoFromRequest(req) {
    return __awaiter(this, void 0, void 0, function () {
        var verifiedJwt, userId, roles, email, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!req.headers.authorization) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, req.jwtVerify()];
                case 1:
                    verifiedJwt = _a.sent();
                    userId = verifiedJwt[USER_ID_CLAIM];
                    roles = verifiedJwt[ROLES_CLAIM] || [];
                    email = verifiedJwt[EMAIL_CLAIM];
                    if (!userId) {
                        throw new Error("Missing user id in JWT");
                    }
                    return [4 /*yield*/, USER_MODEL.findUnique({ where: { id: userId } })];
                case 2:
                    user = _a.sent();
                    // create user if one does not exist already
                    if (!email) {
                        throw new Error("Missing email claim in JWT");
                    }
                    if (!!user) return [3 /*break*/, 4];
                    // Use createMany to avoid race-conditions with creating the user
                    return [4 /*yield*/, prisma.user.createMany({
                            data: [
                                {
                                    id: userId,
                                    auth0Id: verifiedJwt.sub,
                                    email: email
                                },
                            ],
                            skipDuplicates: true
                        })];
                case 3:
                    // Use createMany to avoid race-conditions with creating the user
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, {
                        id: userId,
                        email: email,
                        roles: roles.includes('user') ? roles : __spreadArray(['user'], roles, true),
                        tokenExpiry: typeof verifiedJwt.exp === 'number'
                            ? new Date(verifiedJwt.exp * 1000)
                            : undefined
                    }];
            }
        });
    });
}
exports.getUserInfoFromRequest = getUserInfoFromRequest;
function createAuthInfoFromRequest(req) {
    return __awaiter(this, void 0, void 0, function () {
        var user, roles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserInfoFromRequest(req)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, (0, auth_info_1.createAuthInfoFromUser)(null, ['anonymous'])];
                    }
                    roles = AUTH_ROLE_SERVICE.populateAuthRoles(user === null || user === void 0 ? void 0 : user.roles);
                    return [2 /*return*/, (0, auth_info_1.createAuthInfoFromUser)(user, roles)];
            }
        });
    });
}
exports.createAuthInfoFromRequest = createAuthInfoFromRequest;
function createAuthInfoFromAuthorization(req, authorization) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // We have to manually add the header to the request since we can't
            // use server.jwt.verify due to an error
            req.headers.authorization = authorization;
            return [2 /*return*/, createAuthInfoFromRequest(req)];
        });
    });
}
exports.createAuthInfoFromAuthorization = createAuthInfoFromAuthorization;
