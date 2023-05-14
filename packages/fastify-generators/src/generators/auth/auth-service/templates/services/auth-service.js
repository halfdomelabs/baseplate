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
exports.createAuthInfoFromAuthorization = exports.getUserInfoFromAuthorization = exports.renewToken = exports.loginUser = exports.REFRESH_TOKEN_EXPIRY_SECONDS = exports.ACCESS_TOKEN_EXPIRY_SECONDS = void 0;
var ms_1 = require("ms");
var jwt_service_1 = require("./jwt-service");
var auth_info_1 = require("../utils/auth-info");
exports.ACCESS_TOKEN_EXPIRY_SECONDS = (0, ms_1["default"])(ACCESS_TOKEN_EXPIRY_TIME) / 1000;
exports.REFRESH_TOKEN_EXPIRY_SECONDS = (0, ms_1["default"])(REFRESH_TOKEN_EXPIRY_TIME) / 1000;
function issueUserAuthPayload(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var accessToken, refreshToken;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, jwt_service_1.jwtService.sign({ sub: userId, type: 'access' }, exports.ACCESS_TOKEN_EXPIRY_SECONDS)];
                case 1:
                    accessToken = _a.sent();
                    return [4 /*yield*/, jwt_service_1.jwtService.sign({ sub: userId, type: 'refresh' }, exports.REFRESH_TOKEN_EXPIRY_SECONDS)];
                case 2:
                    refreshToken = _a.sent();
                    return [2 /*return*/, { userId: userId, refreshToken: refreshToken, accessToken: accessToken }];
            }
        });
    });
}
/**
 * check if refresh token was issued after user tokensNotBefore
 * JWTs without an IAT are considered invalid
 */
function isJwtIssueDateValid(payload, notBefore) {
    if (!notBefore) {
        return true;
    }
    return !payload.iat || payload.iat * 1000 < notBefore.getTime();
}
function loginUser(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var payload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, issueUserAuthPayload(userId)];
                case 1:
                    payload = _a.sent();
                    return [2 /*return*/, payload];
            }
        });
    });
}
exports.loginUser = loginUser;
function renewToken(userId, refreshToken) {
    return __awaiter(this, void 0, void 0, function () {
        var user, payload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, USER_MODEL.findUnique({
                        where: { USER_ID_NAME: userId }
                    })];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        throw new jwt_service_1.InvalidTokenError();
                    }
                    return [4 /*yield*/, jwt_service_1.jwtService.verify(refreshToken)];
                case 2:
                    payload = _a.sent();
                    if (payload.type !== 'refresh') {
                        throw new jwt_service_1.InvalidTokenError('Must be provided refresh token');
                    }
                    if (payload.sub !== user.id) {
                        throw new jwt_service_1.InvalidTokenError('Refresh token does not match user ID');
                    }
                    if (!isJwtIssueDateValid(payload, user.tokensNotBefore)) {
                        throw new jwt_service_1.InvalidTokenError('Refresh token has been invalidated');
                    }
                    return [2 /*return*/, issueUserAuthPayload(user.id)];
            }
        });
    });
}
exports.renewToken = renewToken;
function getUserInfoFromToken(accessToken) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, jwt_service_1.jwtService.verify(accessToken)];
                case 1:
                    payload = _a.sent();
                    if (payload.type !== 'access') {
                        throw new jwt_service_1.InvalidTokenError('JWT token is not an access token');
                    }
                    return [4 /*yield*/, prisma.user.findUnique({ where: { id: payload.sub } })];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        throw new jwt_service_1.InvalidTokenError('User not found');
                    }
                    if (!isJwtIssueDateValid(payload, user.tokensNotBefore)) {
                        throw new jwt_service_1.InvalidTokenError('Access token has been invalidated');
                    }
                    return [2 /*return*/, {
                            id: user.id,
                            email: user.email,
                            tokenExpiry: typeof payload.exp === 'number'
                                ? new Date(payload.exp * 1000)
                                : undefined
                        }];
            }
        });
    });
}
function getUserInfoFromAuthorization(authorization) {
    return __awaiter(this, void 0, void 0, function () {
        var accessToken;
        return __generator(this, function (_a) {
            if (!authorization || !authorization.startsWith('Bearer ')) {
                return [2 /*return*/, null];
            }
            accessToken = authorization.substring(7);
            return [2 /*return*/, getUserInfoFromToken(accessToken)];
        });
    });
}
exports.getUserInfoFromAuthorization = getUserInfoFromAuthorization;
function createAuthInfoFromAuthorization(authorization) {
    return __awaiter(this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUserInfoFromAuthorization(authorization)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, (0, auth_info_1.createAuthInfoFromUser)(null, ['anonymous'])];
                    }
                    AUTH_INFO_CREATOR;
                    return [2 /*return*/, (0, auth_info_1.createAuthInfoFromUser)(user, EXTRA_ARGS)];
            }
        });
    });
}
exports.createAuthInfoFromAuthorization = createAuthInfoFromAuthorization;
