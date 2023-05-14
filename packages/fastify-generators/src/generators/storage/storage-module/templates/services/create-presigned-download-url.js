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
exports.createPresignedDownloadUrl = void 0;
var _http_errors_1 = require("%http-errors");
var adapters_1 = require("../constants/adapters");
var file_categories_1 = require("../constants/file-categories");
function createPresignedDownloadUrl(_a, context) {
    var fileId = _a.fileId;
    return __awaiter(this, void 0, void 0, function () {
        var file, category, isAuthorizedToRead, _b, adapter, url;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, FILE_MODEL.findUniqueOrThrow({
                        where: { id: fileId }
                    })];
                case 1:
                    file = _c.sent();
                    category = file_categories_1.FILE_CATEGORIES.find(function (c) { return c.name === file.category; });
                    if (!category) {
                        throw new Error("Invalid file category ".concat(file.category));
                    }
                    _b = !category.authorizeRead;
                    if (_b) return [3 /*break*/, 3];
                    return [4 /*yield*/, category.authorizeRead(file, context)];
                case 2:
                    _b = (_c.sent());
                    _c.label = 3;
                case 3:
                    isAuthorizedToRead = _b;
                    if (!isAuthorizedToRead) {
                        throw new _http_errors_1.ForbiddenError('You are not authorized to read this file');
                    }
                    adapter = adapters_1.STORAGE_ADAPTERS[file.adapter];
                    if (!adapter) {
                        throw new Error("Unknown storage adapter: ".concat(file.adapter));
                    }
                    if (!adapter.createPresignedDownloadUrl) {
                        throw new Error("Storage adapter ".concat(file.adapter, " does not support download URLs"));
                    }
                    return [4 /*yield*/, adapter.createPresignedDownloadUrl(file.path)];
                case 4:
                    url = _c.sent();
                    return [2 /*return*/, { url: url }];
            }
        });
    });
}
exports.createPresignedDownloadUrl = createPresignedDownloadUrl;
