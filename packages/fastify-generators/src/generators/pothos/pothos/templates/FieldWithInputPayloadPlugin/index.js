"use strict";
// @ts-nocheck
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.PothosFieldWithInputPayloadPlugin = exports.pothosFieldWithInputPayloadPlugin = void 0;
require("./global-types");
require("./schema-builder");
var core_1 = require("@pothos/core");
__exportStar(require("./types"), exports);
exports.pothosFieldWithInputPayloadPlugin = 'fieldWithInputPayload';
var PothosFieldWithInputPayloadPlugin = /** @class */ (function (_super) {
    __extends(PothosFieldWithInputPayloadPlugin, _super);
    function PothosFieldWithInputPayloadPlugin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PothosFieldWithInputPayloadPlugin;
}(core_1.BasePlugin));
exports.PothosFieldWithInputPayloadPlugin = PothosFieldWithInputPayloadPlugin;
core_1["default"].registerPlugin(exports.pothosFieldWithInputPayloadPlugin, PothosFieldWithInputPayloadPlugin);
