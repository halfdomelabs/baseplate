"use strict";
// @ts-nocheck
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
exports.formatRefreshTokens = exports.clearRefreshTokenFromCookie = exports.setRefreshTokenIntoCookie = exports.getRefreshTokenFromCookie = void 0;
var _config_1 = require("%config");
var auth_service_1 = require("../services/auth-service");
// localhost does not support the __Host prefix and should be scoped to port
function getRefreshCookieName(context) {
    if (_config_1.config.APP_ENVIRONMENT !== 'development') {
        return '__Host-auth_refresh_token';
    }
    // use referer to determine hostname because React reverse proxies use referer to signal the original host
    var referer = context.reqInfo.headers.referer;
    var port = referer ? new URL(referer).port : _config_1.config.SERVER_PORT;
    return "auth-refresh-token-".concat(port);
}
function getRefreshTokenFromCookie(context) {
    var cookieName = getRefreshCookieName(context);
    return context.cookieStore.get(cookieName);
}
exports.getRefreshTokenFromCookie = getRefreshTokenFromCookie;
function setRefreshTokenIntoCookie(context, refreshToken) {
    var cookieName = getRefreshCookieName(context);
    context.cookieStore.set(cookieName, refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: auth_service_1.REFRESH_TOKEN_EXPIRY_SECONDS
    });
}
exports.setRefreshTokenIntoCookie = setRefreshTokenIntoCookie;
function clearRefreshTokenFromCookie(context) {
    var cookieName = getRefreshCookieName(context);
    context.cookieStore.clear(cookieName);
}
exports.clearRefreshTokenFromCookie = clearRefreshTokenFromCookie;
function formatRefreshTokens(context, payload) {
    // if request needs refresh token returned directly, e.g. mobile app
    // return the refresh token in the payload
    if (context.reqInfo.headers['x-refresh-token-format'] === 'payload') {
        return payload;
    }
    // otherwise, return the access token in the cookie
    setRefreshTokenIntoCookie(context, payload.refreshToken);
    return __assign(__assign({}, payload), { refreshToken: null });
}
exports.formatRefreshTokens = formatRefreshTokens;
