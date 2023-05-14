"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.createAuthInfoFromUser = void 0;
var _http_errors_1 = require("%http-errors");
function createAuthInfoFromUser(user, roles) {
    return {
        user: user,
        requiredUser: function () {
            if (!user) {
                throw new _http_errors_1.UnauthorizedError('User is required');
            }
            return user;
        },
        roles: roles,
        hasSomeRole: function (possibleRoles) {
            return roles.some(function (role) { return possibleRoles.includes(role); });
        },
        hasRole: function (role) { return roles.includes(role); }
    };
}
exports.createAuthInfoFromUser = createAuthInfoFromUser;
