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
exports.getGraphqlWsHandler = void 0;
var graphql_ws_1 = require("graphql-ws");
var websocket_1 = require("graphql-ws/lib/use/@fastify/websocket");
var _error_logger_1 = require("%error-logger");
var _logger_service_1 = require("%logger-service");
var _http_errors_1 = require("%http-errors");
var _request_service_context_1 = require("%request-service-context");
function getGraphqlWsHandler(graphQLServer) {
    var _this = this;
    return (0, websocket_1.makeHandler)({
        execute: function (args) { return args.rootValue.execute(args); },
        onConnect: function (ctx) { return __awaiter(_this, void 0, void 0, function () {
            var authorizationHeader, authInfo, tokenExpiry, socket_1, timeoutHandle_1, httpToSocketErrorMap;
            var _a, _b;
            return __generator(this, function (_c) {
                try {
                    authorizationHeader = (_a = ctx.connectionParams) === null || _a === void 0 ? void 0 : _a.authorization;
                    authInfo = AUTH_INFO_CREATOR;
                    ctx.extra.request.auth = authInfo;
                    tokenExpiry = (_b = authInfo.user) === null || _b === void 0 ? void 0 : _b.tokenExpiry;
                    if (tokenExpiry) {
                        socket_1 = ctx.extra.connection.socket;
                        timeoutHandle_1 = setTimeout(function () {
                            try {
                                socket_1.close(graphql_ws_1.CloseCode.Forbidden, 'token-expired');
                            }
                            catch (err) {
                                (0, _error_logger_1.logError)(err);
                            }
                        }, tokenExpiry.getTime() - Date.now());
                        socket_1.on('close', function () { return clearTimeout(timeoutHandle_1); });
                    }
                }
                catch (err) {
                    httpToSocketErrorMap = {
                        403: graphql_ws_1.CloseCode.Forbidden,
                        // due to implementation of graphql-ws, only Forbidden will be retried
                        // https://github.com/enisdenjo/graphql-ws/blob/master/src/client.ts#L827
                        401: graphql_ws_1.CloseCode.Forbidden,
                        400: graphql_ws_1.CloseCode.BadRequest
                    };
                    _logger_service_1.logger.error("websocket connection failed: ".concat(err instanceof Error ? err.message : typeof err));
                    if (err instanceof _http_errors_1.HttpError && httpToSocketErrorMap[err.statusCode]) {
                        ctx.extra.connection.socket.close(httpToSocketErrorMap[err.statusCode], err.code);
                    }
                    else {
                        (0, _error_logger_1.logError)(err);
                        ctx.extra.connection.socket.close(graphql_ws_1.CloseCode.InternalServerError, 'unknown-error');
                    }
                }
                return [2 /*return*/];
            });
        }); },
        subscribe: function (args) {
            return args.rootValue.subscribe(args);
        },
        onSubscribe: function (ctx, msg) {
            try {
                var _a = graphQLServer.getEnveloped(ctx), schema = _a.schema, execute = _a.execute, subscribe = _a.subscribe, parse = _a.parse, validate = _a.validate;
                var args = {
                    schema: schema,
                    operationName: msg.payload.operationName,
                    document: parse(msg.payload.query),
                    variableValues: msg.payload.variables,
                    contextValue: (0, _request_service_context_1.createContextFromRequest)(ctx.extra.request),
                    rootValue: {
                        execute: execute,
                        subscribe: subscribe
                    }
                };
                var errors = validate(args.schema, args.document);
                if (errors.length)
                    return errors;
                return args;
            }
            catch (err) {
                (0, _error_logger_1.logError)(err);
                throw err;
            }
        }
    });
}
exports.getGraphqlWsHandler = getGraphqlWsHandler;
