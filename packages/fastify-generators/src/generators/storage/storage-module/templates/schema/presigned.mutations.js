"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.presignedUrlFieldObjectType = void 0;
var _pothos_1 = require("%pothos");
var create_presigned_download_url_1 = require("../services/create-presigned-download-url");
var create_presigned_upload_url_1 = require("../services/create-presigned-upload-url");
var FILE_OBJECT_MODULE_1 = require("FILE_OBJECT_MODULE");
exports.presignedUrlFieldObjectType = _pothos_1.builder.simpleObject('PresignedUrlField', {
    fields: function (t) { return ({
        name: t.string(),
        value: t.string()
    }); }
});
_pothos_1.builder.mutationField('createPresignedUploadUrl', function (t) {
    return t.fieldWithInputPayload({
        authorize: 'user',
        input: {
            category: t.input.string({ required: true }),
            contentType: t.input.string({ required: true }),
            fileName: t.input.string({ required: true }),
            fileSize: t.input.int({ required: true })
        },
        payload: {
            url: t.payload.string(),
            method: t.payload.string(),
            fields: t.payload.field({
                type: [exports.presignedUrlFieldObjectType],
                nullable: true
            }),
            file: t.payload.field({ type: FILE_OBJECT_MODULE_1.FILE_OBJECT_TYPE })
        },
        resolve: function (root, args, context) {
            return (0, create_presigned_upload_url_1.createPresignedUploadUrl)(args.input, context);
        }
    });
});
_pothos_1.builder.mutationField('createPresignedDownloadUrl', function (t) {
    return t.fieldWithInputPayload({
        authorize: 'user',
        input: {
            fileId: t.input.field({ required: true, type: 'Uuid' })
        },
        payload: {
            url: t.payload.string()
        },
        resolve: function (root, args, context) {
            return (0, create_presigned_download_url_1.createPresignedDownloadUrl)(args.input, context);
        }
    });
});
