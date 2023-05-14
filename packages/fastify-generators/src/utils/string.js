"use strict";
exports.__esModule = true;
exports.doubleQuot = exports.quot = void 0;
function quot(str) {
    if (str.includes("'")) {
        throw new Error("String cannot contain '");
    }
    return "'".concat(str, "'");
}
exports.quot = quot;
function doubleQuot(str) {
    if (str.includes('"')) {
        throw new Error("String cannot contain \"");
    }
    return "\"".concat(str, "\"");
}
exports.doubleQuot = doubleQuot;
