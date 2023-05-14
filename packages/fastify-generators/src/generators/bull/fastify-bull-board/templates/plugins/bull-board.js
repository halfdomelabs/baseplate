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
exports.bullBoardPlugin = void 0;
var api_1 = require("@bull-board/api");
var bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
var fastify_1 = require("@bull-board/fastify");
var _error_logger_1 = require("%error-logger");
var _http_errors_1 = require("%http-errors");
var auth_service_1 = require("../services/auth.service");
// https://github.com/fastify/fastify/issues/1864
/* eslint-disable @typescript-eslint/no-floating-promises */
function getQueuesToTrack() {
    return QUEUES_TO_TRACK;
}
var ACCESS_TOKEN_COOKIE_NAME = 'bull-board-access-token';
var bullBoardPlugin = function (fastify) { return __awaiter(void 0, void 0, void 0, function () {
    var serverAdapter, queues;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                serverAdapter = new fastify_1.FastifyAdapter();
                queues = getQueuesToTrack();
                (0, api_1.createBullBoard)({
                    queues: queues.map(function (queue) { return new bullMQAdapter_1.BullMQAdapter(queue); }),
                    serverAdapter: serverAdapter
                });
                serverAdapter.setErrorHandler(function (err) {
                    if (err instanceof _http_errors_1.HttpError) {
                        // hack as type doesn't accept 401
                        return {
                            status: err.statusCode,
                            body: JSON.stringify({ message: err.message })
                        };
                    }
                    (0, _error_logger_1.logError)(err);
                    return { status: 500, body: 'Internal server error' };
                });
                serverAdapter.setBasePath('/bull-board/ui');
                return [4 /*yield*/, fastify.register(serverAdapter.registerPlugin(), {
                        basePath: '/bull-board/ui',
                        prefix: '/bull-board/ui'
                    })];
            case 1:
                _a.sent();
                fastify.post('/bull-board/auth', {
                    schema: {
                        body: {
                            type: 'object',
                            properties: { code: { type: 'string' } }
                        }
                    },
                    handler: function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
                        var authCode, accessToken;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    authCode = req.body.code;
                                    return [4 /*yield*/, (0, auth_service_1.authenticateBullBoardUser)(authCode)];
                                case 1:
                                    accessToken = _a.sent();
                                    reply
                                        .setCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
                                        httpOnly: true,
                                        secure: true,
                                        sameSite: 'strict',
                                        path: '/bull-board',
                                        maxAge: auth_service_1.BULL_BOARD_ACCESS_TOKEN_EXPIRY
                                    })
                                        .redirect('ui');
                                    return [2 /*return*/];
                            }
                        });
                    }); }
                });
                fastify.addHook('preHandler', function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
                    var accessToken;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (request.url.startsWith('/bull-board/auth')) {
                                    return [2 /*return*/];
                                }
                                accessToken = request.cookies[ACCESS_TOKEN_COOKIE_NAME];
                                if (typeof accessToken !== 'string') {
                                    throw new _http_errors_1.UnauthorizedError('Invalid access token');
                                }
                                return [4 /*yield*/, (0, auth_service_1.validateBullBoardAccessToken)(accessToken)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
        }
    });
}); };
exports.bullBoardPlugin = bullBoardPlugin;
