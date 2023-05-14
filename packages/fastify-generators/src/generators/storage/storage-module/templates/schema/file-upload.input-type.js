"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.fileUploadInputInputType = void 0;
var _pothos_1 = require("%pothos");
exports.fileUploadInputInputType = _pothos_1.builder.inputType('FileUploadInput', {
    fields: function (t) { return ({
        id: t.field({ required: true, type: 'Uuid' }),
        name: t.string({ description: 'Discarded but useful for forms' })
    }); }
});
