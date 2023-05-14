"use strict";
// @ts-nocheck
exports.__esModule = true;
var _pothos_1 = require("%pothos");
var adapters_1 = require("../constants/adapters");
var FILE_OBJECT_MODULE_1 = require("FILE_OBJECT_MODULE");
_pothos_1.builder.objectField(FILE_OBJECT_MODULE_1.FILE_OBJECT_TYPE, 'hostedUrl', function (t) {
    return t.string({
        description: 'URL of the file where it is publicly hosted. Returns null if it is not publicly available.',
        nullable: true,
        resolve: function (_a) {
            var _b;
            var adapterName = _a.adapter, path = _a.path;
            var adapter = adapters_1.STORAGE_ADAPTERS[adapterName];
            if (!adapter) {
                throw new Error("Unknown adapter ".concat(adapterName));
            }
            return ((_b = adapter === null || adapter === void 0 ? void 0 : adapter.getHostedUrl) === null || _b === void 0 ? void 0 : _b.call(adapter, path)) || null;
        }
    });
});
