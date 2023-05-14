"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
exports.flattenAppModule = void 0;
function flattenAppModule(module) {
    var children = module.children, rest = __rest(module, ["children"]);
    if (!(children === null || children === void 0 ? void 0 : children.length)) {
        return rest;
    }
    var flattenedChildren = children.map(function (child) { return flattenAppModule(child); });
    return __spreadArray([module], flattenedChildren, true).reduce(function (prev, current) { return MODULE_MERGER; }, {});
}
exports.flattenAppModule = flattenAppModule;
