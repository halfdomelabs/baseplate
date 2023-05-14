"use strict";
exports.__esModule = true;
exports.prismaCrudServiceProvider = exports.prismaCrudServiceSetupProvider = void 0;
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var descriptorSchema = zod_1.z.object({
    modelName: zod_1.z.string().min(1)
});
exports.prismaCrudServiceSetupProvider = (0, sync_1.createProviderType)('prisma-crud-service-setup');
exports.prismaCrudServiceProvider = (0, sync_1.createProviderType)('prisma-crud-service');
var PrismaCrudServiceGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function (_a) {
        var modelName = _a.modelName;
        return ({
            create: {
                defaultDescriptor: {
                    generator: '@baseplate/fastify/prisma/prisma-crud-create',
                    name: 'create',
                    modelName: modelName
                }
            },
            update: {
                defaultDescriptor: {
                    generator: '@baseplate/fastify/prisma/prisma-crud-update',
                    name: 'update',
                    type: 'update',
                    modelName: modelName
                }
            },
            "delete": {
                defaultDescriptor: {
                    generator: '@baseplate/fastify/prisma/prisma-crud-delete',
                    name: 'delete',
                    modelName: modelName
                }
            },
            transformers: { isMultiple: true }
        });
    },
    buildTasks: function (taskBuilder, _a) {
        var modelName = _a.modelName;
        var setupTask = taskBuilder.addTask({
            name: 'setup',
            exports: { prismaCrudServiceSetup: exports.prismaCrudServiceSetupProvider },
            run: function () {
                var transformers = (0, sync_1.createNonOverwriteableMap)({});
                return {
                    getProviders: function () { return ({
                        prismaCrudServiceSetup: {
                            getModelName: function () {
                                return modelName;
                            },
                            addTransformer: function (name, transformer) {
                                transformers.set(name, transformer);
                            }
                        }
                    }); },
                    build: function () { return ({ transformers: transformers }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'main',
            taskDependencies: { setupTask: setupTask },
            exports: { prismaCrudService: exports.prismaCrudServiceProvider },
            run: function (deps, _a) {
                var transformers = _a.setupTask.transformers;
                return {
                    getProviders: function () {
                        return {
                            prismaCrudService: {
                                getTransformerByName: function (name) {
                                    var transformer = transformers.get(name);
                                    if (!transformer) {
                                        throw new Error("Transformer ".concat(name, " not found"));
                                    }
                                    return transformer;
                                }
                            }
                        };
                    }
                };
            }
        });
    }
});
exports["default"] = PrismaCrudServiceGenerator;
