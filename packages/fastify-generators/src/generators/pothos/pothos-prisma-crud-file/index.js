"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var pothos_types_file_1 = require("../pothos-types-file");
var descriptorSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1),
    modelName: zod_1.z.string().min(1),
    objectTypeRef: zod_1.z.string().min(1),
    crudServiceRef: zod_1.z.string().min(1)
});
var PothosPrismaCrudFileGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function (descriptor) {
        var sharedValues = {
            generator: '@baseplate/fastify/pothos/pothos-prisma-crud-mutation',
            modelName: descriptor.modelName,
            objectTypeRef: descriptor.objectTypeRef,
            crudServiceRef: descriptor.crudServiceRef
        };
        return {
            create: {
                defaultDescriptor: __assign(__assign({}, sharedValues), { type: 'create' })
            },
            update: {
                defaultDescriptor: __assign(__assign({}, sharedValues), { type: 'update' })
            },
            "delete": {
                defaultDescriptor: __assign(__assign({}, sharedValues), { type: 'delete' })
            }
        };
    },
    buildTasks: function (taskBuilder, _a) {
        var fileName = _a.fileName;
        taskBuilder.addTask((0, pothos_types_file_1.createPothosTypesFileTask)({
            fileName: fileName
        }));
    }
});
exports["default"] = PothosPrismaCrudFileGenerator;
