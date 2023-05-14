"use strict";
exports.__esModule = true;
exports.createUrlAdapter = void 0;
/**
 * Minimal adapter that just converts path to URL directly.
 */
var createUrlAdapter = function () { return ({
    getHostedUrl: function (path) {
        return path;
    },
    createPresignedDownloadUrl: function (path) {
        return Promise.resolve(path);
    }
}); };
exports.createUrlAdapter = createUrlAdapter;
