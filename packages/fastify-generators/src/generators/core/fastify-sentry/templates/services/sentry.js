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
exports.__esModule = true;
exports.logErrorToSentry = exports.configureSentryScope = exports.extractSentryRequestData = exports.getUrlQueryString = void 0;
// @ts-nocheck
var os_1 = require("os");
var url_1 = require("url");
var Sentry = require("@sentry/node");
var request_context_1 = require("@fastify/request-context");
var lodash_1 = require("lodash");
require("@sentry/tracing");
var SENTRY_ENABLED = !!CONFIG.SENTRY_DSN;
var IGNORED_TRANSACTION_PATHS = ['/graphql', '/healthz'];
if (SENTRY_ENABLED) {
    Sentry.init({
        dsn: CONFIG.SENTRY_DSN,
        environment: CONFIG.APP_ENVIRONMENT,
        serverName: os_1["default"].hostname(),
        integrations: SENTRY_INTEGRATIONS,
        tracesSampleRate: 1.0,
        tracesSampler: function (samplingContext) {
            var _a, _b;
            if (((_a = samplingContext === null || samplingContext === void 0 ? void 0 : samplingContext.request) === null || _a === void 0 ? void 0 : _a.url) &&
                IGNORED_TRANSACTION_PATHS.includes((_b = samplingContext === null || samplingContext === void 0 ? void 0 : samplingContext.request) === null || _b === void 0 ? void 0 : _b.url)) {
                return false;
            }
            return true;
        }
    });
}
var SENSITIVE_HEADERS = ['authorization'];
// filters headers that are sensitive or not strings
function filterHeaders(headers) {
    return lodash_1["default"].fromPairs(Object.keys(headers)
        .filter(function (key) { return typeof headers[key] === 'string'; })
        .filter(function (key) { return !SENSITIVE_HEADERS.includes(key); })
        .map(function (key) { return [key, headers[key]]; }));
}
function getUrlQueryString(url) {
    // need arbitrary base to make URL work
    var parsedUrl = new url_1.URL(url, 'http://a');
    return parsedUrl.search;
}
exports.getUrlQueryString = getUrlQueryString;
function extractSentryRequestData(request) {
    return {
        headers: filterHeaders(request.headers),
        method: request.method,
        url: request.url,
        query_string: getUrlQueryString(request.url)
    };
}
exports.extractSentryRequestData = extractSentryRequestData;
function configureSentryScope(scope) {
    var requestData = request_context_1.requestContext.get('reqInfo');
    if (requestData) {
        scope.setUser({
            ip_address: requestData.ip
        });
        scope.setTag('path', requestData.url);
        scope.setTag('request_id', requestData.id);
        var sentryRequestData_1 = extractSentryRequestData(requestData);
        scope.addEventProcessor(function (event) { return (__assign(__assign({}, event), { request: __assign(__assign({}, event.request), sentryRequestData_1) })); });
    }
    SCOPE_CONFIGURATION_BLOCKS;
}
exports.configureSentryScope = configureSentryScope;
function logErrorToSentry(error) {
    if (!SENTRY_ENABLED) {
        return;
    }
    Sentry.withScope(function (scope) {
        configureSentryScope(scope);
        Sentry.captureException(error);
    });
}
exports.logErrorToSentry = logErrorToSentry;
