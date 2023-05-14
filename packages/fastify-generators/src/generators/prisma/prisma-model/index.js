"use strict";
exports.__esModule = true;
exports.prismaModelProvider = void 0;
var sync_1 = require("@baseplate/sync");
var change_case_1 = require("change-case");
var zod_1 = require("zod");
var prisma_schema_1 = require("@src/writers/prisma-schema");
var prisma_1 = require("../prisma");
var descriptorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    tableName: zod_1.z.string().optional()
});
exports.prismaModelProvider = (0, sync_1.createProviderType)('prisma-model');
var PrismaModelGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({
        fields: {
            isMultiple: true,
            defaultDescriptor: {
                generator: '@baseplate/fastify/prisma/prisma-field'
            }
        },
        relations: {
            isMultiple: true,
            defaultDescriptor: {
                generator: '@baseplate/fastify/prisma/prisma-relation-field'
            }
        },
        primaryKey: {
            defaultToNullIfEmpty: true,
            defaultDescriptor: {
                generator: '@baseplate/fastify/prisma/prisma-model-id'
            }
        },
        indicies: {
            isMultiple: true,
            defaultDescriptor: {
                generator: '@baseplate/fastify/prisma/prisma-model-index'
            }
        },
        uniqueConstraints: {
            isMultiple: true,
            defaultDescriptor: {
                generator: '@baseplate/fastify/prisma/prisma-model-unique'
            }
        },
        generatedFields: {
            isMultiple: true
        }
    }); },
    dependencies: {
        prisma: prisma_1.prismaSchemaProvider.dependency().modifiedInBuild()
    },
    exports: {
        prismaModel: exports.prismaModelProvider
    },
    createGenerator: function (descriptor, _a) {
        var prisma = _a.prisma;
        var name = descriptor.name;
        var tableName = descriptor.tableName || (0, change_case_1.snakeCase)(name);
        var prismaModel = new prisma_schema_1.PrismaModelBlockWriter({ name: name, tableName: tableName });
        var config = (0, sync_1.createNonOverwriteableMap)({}, { name: 'prisma-model-config' });
        return {
            getProviders: function () { return ({
                prismaModel: {
                    getConfig: function () { return config; },
                    getName: function () { return name; },
                    addField: function (field) { return prismaModel.addField(field); },
                    addModelAttribute: function (attribute) { return prismaModel.addAttribute(attribute); }
                }
            }); },
            build: function () {
                prisma.addPrismaModel(prismaModel);
            }
        };
    }
});
exports["default"] = PrismaModelGenerator;
