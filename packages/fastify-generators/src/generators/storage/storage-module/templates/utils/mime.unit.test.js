"use strict";
// @ts-nocheck
exports.__esModule = true;
var mime_1 = require("./mime");
describe('validateFileExtensionWithMimeType', function () {
    it.each([
        { mimeType: 'text/html', fileName: 'test.html' },
        { mimeType: 'image/jpeg', fileName: 'image.jpg' },
        { mimeType: 'image/jpeg', fileName: 'image.jpeg' },
    ])('should match $fileName as $mimeType', function (_a) {
        var mimeType = _a.mimeType, fileName = _a.fileName;
        expect(function () {
            (0, mime_1.validateFileExtensionWithMimeType)(mimeType, fileName);
        }).not.toThrow();
    });
    it.each([
        { mimeType: 'text/html', fileName: 'test.html5' },
        { mimeType: 'text/jpeg', fileName: 'image.exe' },
    ])('should not match $fileName as $mimeType', function (_a) {
        var mimeType = _a.mimeType, fileName = _a.fileName;
        expect(function () {
            (0, mime_1.validateFileExtensionWithMimeType)(mimeType, fileName);
        }).toThrow();
    });
});
