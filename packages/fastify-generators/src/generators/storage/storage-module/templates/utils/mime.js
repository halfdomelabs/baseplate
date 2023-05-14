"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.validateFileExtensionWithMimeType = exports.getMimeTypeFromContentType = void 0;
var path_1 = require("path");
var mime_types_1 = require("mime-types");
function getMimeTypeFromContentType(contentType) {
    return contentType.split(':')[0];
}
exports.getMimeTypeFromContentType = getMimeTypeFromContentType;
function validateFileExtensionWithMimeType(mimeType, fileName) {
    var extensions = mime_types_1["default"].extensions[mimeType];
    if (!extensions) {
        throw new Error("Invalid mime type ".concat(mimeType));
    }
    var extension = (0, path_1.extname)(fileName).substring(1).toLowerCase();
    if (!extensions.includes(extension)) {
        throw new Error("File extension ".concat(extension, " does not match mime type ").concat(mimeType));
    }
}
exports.validateFileExtensionWithMimeType = validateFileExtensionWithMimeType;
