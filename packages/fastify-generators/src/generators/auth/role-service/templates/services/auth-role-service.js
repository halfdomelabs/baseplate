"use strict";
// @ts-nocheck
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
exports.authRoleService = exports.AUTH_ROLE_CONFIG = void 0;
// HEADER:START
HEADER;
AVAILABLE_ROLES_EXPORT;
exports.AUTH_ROLE_CONFIG = ROLE_MAP;
function getInheritedRoles(role) {
    var roleConfig = exports.AUTH_ROLE_CONFIG[role];
    if (!roleConfig.inherits) {
        return [];
    }
    return roleConfig.inherits.flatMap(function (inheritedRole) { return __spreadArray([
        inheritedRole
    ], getInheritedRoles(inheritedRole), true); });
}
// HEADER:END
exports.authRoleService = {
    // BODY:START
    populateAuthRoles: function (roles) {
        if (!roles) {
            return ['anonymous'];
        }
        var availableRoles = roles
            .filter(function (role) { return exports.AUTH_ROLE_CONFIG[role]; })
            .flatMap(function (role) { return __spreadArray([role], getInheritedRoles(role), true); });
        return availableRoles;
    }
};
