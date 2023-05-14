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
exports.createS3Adapter = void 0;
var client_s3_1 = require("@aws-sdk/client-s3");
var s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
var s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
var PRESIGNED_S3_EXPIRATION_SECONDS = 600;
var createS3Adapter = function (options) {
    var region = options.region, hostedUrl = options.hostedUrl, bucket = options.bucket;
    var client = new client_s3_1.S3Client({ region: region });
    function createPresignedUploadUrl(input) {
        return __awaiter(this, void 0, void 0, function () {
            var path, contentType, minFileSize, maxFileSize, _a, url, fields;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        path = input.path, contentType = input.contentType, minFileSize = input.minFileSize, maxFileSize = input.maxFileSize;
                        return [4 /*yield*/, (0, s3_presigned_post_1.createPresignedPost)(client, {
                                Bucket: bucket,
                                Key: path,
                                Conditions: __spreadArray([
                                    ['content-length-range', minFileSize || 0, maxFileSize],
                                    { bucket: bucket },
                                    { key: path }
                                ], (contentType ? [{ 'Content-Type': contentType }] : []), true),
                                Expires: PRESIGNED_S3_EXPIRATION_SECONDS
                            })];
                    case 1:
                        _a = _b.sent(), url = _a.url, fields = _a.fields;
                        return [2 /*return*/, {
                                method: 'POST',
                                url: url,
                                fields: Object.entries(fields).map(function (_a) {
                                    var name = _a[0], value = _a[1];
                                    return ({ name: name, value: value });
                                })
                            }];
                }
            });
        });
    }
    function createPresignedDownloadUrl(path) {
        return __awaiter(this, void 0, void 0, function () {
            var command;
            return __generator(this, function (_a) {
                command = new client_s3_1.GetObjectCommand({
                    Bucket: bucket,
                    Key: path
                });
                return [2 /*return*/, (0, s3_request_presigner_1.getSignedUrl)(client, command, {
                        expiresIn: PRESIGNED_S3_EXPIRATION_SECONDS
                    })];
            });
        });
    }
    function getHostedUrl(path) {
        if (!hostedUrl) {
            return null;
        }
        return "".concat(hostedUrl.replace(/\/$/, ''), "/").concat(path);
    }
    function uploadFile(path, contents) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, client.send(new client_s3_1.PutObjectCommand({
                            Bucket: bucket,
                            Key: path,
                            Body: contents,
                            ServerSideEncryption: 'AES256'
                        }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function downloadFile(path) {
        return __awaiter(this, void 0, void 0, function () {
            var command, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        command = new client_s3_1.GetObjectCommand({
                            Bucket: bucket,
                            Key: path
                        });
                        return [4 /*yield*/, client.send(command)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.Body];
                }
            });
        });
    }
    return {
        createPresignedUploadUrl: createPresignedUploadUrl,
        createPresignedDownloadUrl: createPresignedDownloadUrl,
        getHostedUrl: getHostedUrl,
        uploadFile: uploadFile,
        downloadFile: downloadFile
    };
};
exports.createS3Adapter = createS3Adapter;
