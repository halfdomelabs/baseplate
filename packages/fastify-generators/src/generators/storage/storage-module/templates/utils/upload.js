"use strict";
// @ts-nocheck
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.prepareUploadData = void 0;
var nanoid_1 = require("nanoid");
var _http_errors_1 = require("%http-errors");
var adapters_1 = require("../constants/adapters");
var file_categories_1 = require("../constants/file-categories");
var mime_1 = require("./mime");
/**
 * There are a set of unsafe characters that should be replaced
 *
 * https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
 *
 */
function makeFileNameSafe(filename) {
    return filename.replace(/[^a-zA-Z0-9!\-_.*'()]/g, '_');
}
function prepareUploadData(_a, context) {
    var _b;
    var category = _a.category, contentType = _a.contentType, fileName = _a.fileName, fileSize = _a.fileSize;
    return __awaiter(this, void 0, void 0, function () {
        var fileCategory, _c, mimeType, adapter, cleanedFileName, path;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    fileCategory = file_categories_1.FILE_CATEGORIES.find(function (c) { return c.name === category; });
                    if (!fileCategory) {
                        throw new _http_errors_1.BadRequestError("Invalid file category ".concat(category));
                    }
                    _c = !fileCategory.authorizeUpload;
                    if (_c) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.resolve(fileCategory.authorizeUpload(context))];
                case 1:
                    _c = !(_d.sent());
                    _d.label = 2;
                case 2:
                    if (_c) {
                        throw new _http_errors_1.ForbiddenError("You are not authorized to upload files to ".concat(category));
                    }
                    if (fileCategory.minFileSize && fileSize < fileCategory.minFileSize) {
                        throw new _http_errors_1.BadRequestError("File size is below minimum file size of ".concat(fileCategory.minFileSize));
                    }
                    if (fileCategory.maxFileSize && fileSize > fileCategory.maxFileSize) {
                        throw new _http_errors_1.BadRequestError("File size is above maximum file size of ".concat(fileCategory.maxFileSize));
                    }
                    mimeType = (0, mime_1.getMimeTypeFromContentType)(contentType);
                    (0, mime_1.validateFileExtensionWithMimeType)(mimeType, fileName);
                    if (fileCategory.allowedMimeTypes &&
                        !fileCategory.allowedMimeTypes.includes(mimeType)) {
                        throw new _http_errors_1.BadRequestError("File mime type ".concat(mimeType, " is not allowed for ").concat(fileCategory.name));
                    }
                    adapter = adapters_1.STORAGE_ADAPTERS[fileCategory.defaultAdapter];
                    if (fileName.length > 128) {
                        throw new _http_errors_1.BadRequestError("File name is too long");
                    }
                    cleanedFileName = makeFileNameSafe(fileName);
                    path = "".concat(fileCategory.name, "/").concat((0, nanoid_1.nanoid)(14), "/").concat(cleanedFileName);
                    return [2 /*return*/, {
                            adapter: adapter,
                            fileCategory: fileCategory,
                            data: {
                                name: cleanedFileName,
                                path: path,
                                category: fileCategory.name,
                                adapter: fileCategory.defaultAdapter,
                                mimeType: mimeType,
                                size: fileSize,
                                shouldDelete: false,
                                isUsed: false,
                                uploader: context.auth.user
                                    ? { connect: { id: (_b = context.auth.user) === null || _b === void 0 ? void 0 : _b.id } }
                                    : undefined
                            }
                        }];
            }
        });
    });
}
exports.prepareUploadData = prepareUploadData;
