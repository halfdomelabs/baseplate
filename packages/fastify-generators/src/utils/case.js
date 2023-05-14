"use strict";
exports.__esModule = true;
exports.upperCaseFirst = exports.lowerCaseFirst = void 0;
function lowerCaseFirst(str) {
    if (!str.length) {
        return str;
    }
    return str.charAt(0).toLowerCase() + str.substring(1);
}
exports.lowerCaseFirst = lowerCaseFirst;
function upperCaseFirst(str) {
    if (!str.length) {
        return str;
    }
    return str.charAt(0).toUpperCase() + str.substring(1);
}
exports.upperCaseFirst = upperCaseFirst;
