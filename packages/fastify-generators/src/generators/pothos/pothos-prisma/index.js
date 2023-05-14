"use strict";
exports.__esModule = true;
exports.pothosPrismaProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var prisma_1 = require("@src/generators/prisma/prisma");
var prisma_schema_1 = require("@src/writers/prisma-schema");
var pothos_1 = require("../pothos");
var descriptorSchema = zod_1.z.object({});
exports.pothosPrismaProvider = (0, sync_1.createProviderType)('pothos-prisma');
var createMainTask = (0, sync_1.createTaskConfigBuilder)(function () { return ({
    name: 'main',
    dependencies: {
        node: core_generators_1.nodeProvider,
        pothosSetup: pothos_1.pothosSetupProvider,
        prismaOutput: prisma_1.prismaOutputProvider
    },
    exports: {
        pothosPrisma: exports.pothosPrismaProvider
    },
    run: function (_a) {
        var node = _a.node, pothosSetup = _a.pothosSetup, prismaOutput = _a.prismaOutput;
        return {
            getProviders: function () { return ({
                pothosPrisma: {}
            }); },
            build: function () {
                node.addPackages({ '@pothos/plugin-prisma': '3.40.1' });
                pothosSetup
                    .getConfig()
                    .append('pothosPlugins', core_generators_1.TypescriptCodeUtils.createExpression("PrismaPlugin", "import PrismaPlugin from '@pothos/plugin-prisma';"))
                    .append('schemaTypeOptions', {
                    key: 'PrismaTypes',
                    value: core_generators_1.TypescriptCodeUtils.createExpression("PrismaTypes", "import type PrismaTypes from '@pothos/plugin-prisma/generated';")
                })
                    .append('schemaBuilderOptions', {
                    key: 'prisma',
                    value: core_generators_1.TypescriptCodeUtils.createExpression("{\n                client: prisma,\n                exposeDescriptions: false,\n                filterConnectionTotalCount: true,\n              }", 'import { prisma } from "%prisma-service"', { importMappers: [prismaOutput] })
                });
            }
        };
    }
}); });
var PothosPrismaGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        taskBuilder.addTask(createMainTask(descriptor));
        taskBuilder.addTask({
            name: 'prisma-generator',
            dependencies: {
                prismaSchema: prisma_1.prismaSchemaProvider
            },
            run: function (_a) {
                var prismaSchema = _a.prismaSchema;
                prismaSchema.addPrismaGenerator((0, prisma_schema_1.createPrismaSchemaGeneratorBlock)({
                    name: 'pothos',
                    provider: 'yarn prisma-pothos-types'
                }));
                return {};
            }
        });
    }
});
exports["default"] = PothosPrismaGenerator;
