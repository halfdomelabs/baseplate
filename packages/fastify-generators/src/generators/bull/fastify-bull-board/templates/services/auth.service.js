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
exports.validateBullBoardAccessToken = exports.authenticateBullBoardUser = exports.createBullBoardAuthCode = exports.BULL_BOARD_ACCESS_TOKEN_EXPIRY = void 0;
var ms_1 = require("ms");
var nanoid_1 = require("nanoid");
var _fastify_redis_1 = require("%fastify-redis");
var _http_errors_1 = require("%http-errors");
var AUTH_CODE_EXPIRY = (0, ms_1["default"])('1 minute');
exports.BULL_BOARD_ACCESS_TOKEN_EXPIRY = (0, ms_1["default"])('1 hour');
function getAuthKey(authCode) {
    return "bull-board:auth-code#".concat(authCode);
}
function createBullBoardAuthCode() {
    return __awaiter(this, void 0, void 0, function () {
        var authCode, redis;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    authCode = (0, nanoid_1.nanoid)();
                    redis = (0, _fastify_redis_1.getRedisClient)();
                    return [4 /*yield*/, redis.set(getAuthKey(authCode), 'true', 'PX', AUTH_CODE_EXPIRY)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, authCode];
            }
        });
    });
}
exports.createBullBoardAuthCode = createBullBoardAuthCode;
function getAccessTokenKey(accessToken) {
    return "bull-board:access-token#".concat(accessToken);
}
function authenticateBullBoardUser(authCode) {
    return __awaiter(this, void 0, void 0, function () {
        var redis, authKey, isAuthCodeValid, accessToken, accessTokenKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    redis = (0, _fastify_redis_1.getRedisClient)();
                    authKey = getAuthKey(authCode);
                    return [4 /*yield*/, redis.get(authKey)];
                case 1:
                    isAuthCodeValid = _a.sent();
                    if (!isAuthCodeValid) {
                        throw new _http_errors_1.BadRequestError('Invalid auth code');
                    }
                    accessToken = (0, nanoid_1.nanoid)();
                    accessTokenKey = getAccessTokenKey(accessToken);
                    return [4 /*yield*/, redis.set(accessTokenKey, 'true', 'PX', exports.BULL_BOARD_ACCESS_TOKEN_EXPIRY)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, redis.del(authKey)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, accessToken];
            }
        });
    });
}
exports.authenticateBullBoardUser = authenticateBullBoardUser;
function validateBullBoardAccessToken(accessToken) {
    return __awaiter(this, void 0, void 0, function () {
        var redis, accessTokenKey, isAccessTokenValid;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    redis = (0, _fastify_redis_1.getRedisClient)();
                    accessTokenKey = getAccessTokenKey(accessToken);
                    return [4 /*yield*/, redis.get(accessTokenKey)];
                case 1:
                    isAccessTokenValid = _a.sent();
                    if (!isAccessTokenValid) {
                        throw new _http_errors_1.UnauthorizedError('Invalid access token');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.validateBullBoardAccessToken = validateBullBoardAccessToken;
