"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.sentryPlugin = void 0;
// @ts-nocheck
var domain = require("domain");
var url_1 = require("url");
var Sentry = require("@sentry/node");
var tracing_1 = require("@sentry/tracing");
var fastify_plugin_1 = require("fastify-plugin");
var sentry_1 = require("../services/sentry");
function getTransactionName(request) {
    var parsedUrl = new url_1.URL(request.url, 'http://a');
    return "".concat(request.method, " ").concat(parsedUrl.pathname);
}
exports.sentryPlugin = (0, fastify_plugin_1["default"])(function (fastify) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        fastify.decorateRequest('sentryTransaction', null);
        fastify.addHook('onRequest', function (req, reply, done) {
            // create domain for request (like handler in Sentry Express handler)
            // Domain is deprecated but still used by Sentry
            // See https://github.com/getsentry/sentry-javascript/issues/4633
            var local = domain.create();
            local.on('error', done);
            local.run(function () {
                var traceparentData;
                if (typeof req.headers['sentry-trace'] === 'string') {
                    traceparentData = (0, tracing_1.extractTraceparentData)(req.headers['sentry-trace']);
                }
                req.sentryTransaction = Sentry.startTransaction(__assign({ name: getTransactionName(req), op: 'http.server' }, traceparentData), { request: (0, sentry_1.extractSentryRequestData)(req) });
                done();
            });
        });
        fastify.addHook('onResponse', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!req.sentryTransaction) {
                    return [2 /*return*/];
                }
                setImmediate(function () {
                    var transaction = req.sentryTransaction;
                    transaction.setData('url', req.url);
                    transaction.setData('query', (0, sentry_1.getUrlQueryString)(req.url));
                    transaction.setHttpStatus(reply.statusCode);
                    transaction.finish();
                });
                return [2 /*return*/];
            });
        }); });
        return [2 /*return*/];
    });
}); });
