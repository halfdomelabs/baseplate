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
var nexus_types_file_1 = require("../nexus-types-file");
var descriptorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    modelName: zod_1.z.string().min(1)
});
var NexusPrismaQueryFileGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function (descriptor) {
        var sharedValues = {
            modelName: descriptor.modelName
        };
        return {
            objectType: {
                defaultDescriptor: __assign(__assign({}, sharedValues), { generator: '@baseplate/fastify/nexus/nexus-prisma-object' }),
                defaultToNullIfEmpty: true
            },
            findQuery: {
                defaultDescriptor: __assign(__assign({}, sharedValues), { generator: '@baseplate/fastify/nexus/nexus-prisma-find-query' }),
                defaultToNullIfEmpty: true
            },
            listQuery: {
                defaultDescriptor: __assign(__assign({}, sharedValues), { generator: '@baseplate/fastify/nexus/nexus-prisma-list-query' }),
                defaultToNullIfEmpty: true
            }
        };
    },
    buildTasks: function (taskBuilder, _a) {
        var name = _a.name;
        taskBuilder.addTask((0, nexus_types_file_1.createNexusTypesFileTask)({
            name: name,
            categoryOrder: ['object-type', 'find-query', 'list-query']
        }));
    }
});
exports["default"] = NexusPrismaQueryFileGenerator;
