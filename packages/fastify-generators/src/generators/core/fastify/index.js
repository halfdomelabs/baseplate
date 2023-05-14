"use strict";
exports.__esModule = true;
exports.fastifyOutputProvider = exports.fastifyProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var setupFastifyTypescript_1 = require("./setupFastifyTypescript");
var descriptorSchema = zod_1.z.object({
    placeholder: zod_1.z.string().optional()
});
exports.fastifyProvider = (0, sync_1.createProviderType)('fastify');
exports.fastifyOutputProvider = (0, sync_1.createProviderType)('fastify-output');
var FastifyGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({
        logger: {
            provider: 'logger-service',
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/logger-service',
                peerProvider: true
            }
        },
        rootModule: {
            provider: 'root-module',
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/root-module',
                peerProvider: true
            }
        },
        errorHandler: {
            provider: 'error-handler-service',
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/error-handler-service',
                peerProvider: true
            }
        },
        config: {
            provider: 'config-service',
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/config-service',
                peerProvider: true
            }
        },
        server: {
            provider: 'fastify-server',
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/fastify-server',
                peerProvider: true
            }
        },
        healthCheck: {
            provider: 'fastify-health-check',
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/fastify-health-check',
                peerProvider: true
            }
        },
        requestContext: {
            provider: 'request-context',
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/request-context',
                peerProvider: true
            }
        },
        gracefulShutdown: {
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/fastify-graceful-shutdown'
            }
        },
        jest: {
            provider: 'fastify-jest',
            defaultDescriptor: {
                generator: '@baseplate/fastify/jest/fastify-jest',
                peerProvider: true
            }
        },
        serviceContext: {
            provider: 'service-context',
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/service-context',
                peerProvider: true
            }
        },
        requestServiceContext: {
            provider: 'request-service-context',
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/request-service-context',
                peerProvider: true
            }
        },
        cookies: {
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/fastify-cookie-context'
            }
        },
        scripts: {
            defaultDescriptor: {
                generator: '@baseplate/fastify/core/fastify-scripts'
            }
        }
    }); },
    buildTasks: function (taskBuilder) {
        taskBuilder.addTask({
            name: 'typescript',
            dependencies: {
                node: core_generators_1.nodeProvider,
                typescriptConfig: core_generators_1.typescriptConfigProvider
            },
            run: function (_a) {
                var node = _a.node, typescriptConfig = _a.typescriptConfig;
                (0, setupFastifyTypescript_1.setupFastifyTypescript)(node, typescriptConfig);
                return {};
            }
        });
        var mainTask = taskBuilder.addTask({
            name: 'main',
            dependencies: {
                node: core_generators_1.nodeProvider,
                nodeGitIgnore: core_generators_1.nodeGitIgnoreProvider
            },
            exports: {
                fastify: exports.fastifyProvider
            },
            run: function (_a) {
                var node = _a.node, nodeGitIgnore = _a.nodeGitIgnore;
                var config = (0, sync_1.createNonOverwriteableMap)({ devLoaders: ['tsconfig-paths/register'] }, { name: 'fastify-config', mergeArraysUniquely: true });
                node.mergeExtraProperties({
                    main: 'dist/index.js'
                });
                nodeGitIgnore.addExclusions(['/dist']);
                var formatDevLoaders = function (loaders) {
                    return (loaders || []).map(function (loader) { return "-r ".concat(loader); }).join(' ');
                };
                return {
                    getProviders: function () { return ({
                        fastify: {
                            getConfig: function () { return config; }
                        }
                    }); },
                    build: function () {
                        // add scripts
                        var _a = config.value(), devOutputFormatter = _a.devOutputFormatter, devLoaders = _a.devLoaders;
                        var devRegister = formatDevLoaders(devLoaders || []);
                        var devCommand = "ts-node-dev --rs --transpile-only --respawn ".concat(devRegister, " src").concat(devOutputFormatter ? " | ".concat(devOutputFormatter) : '');
                        node.addScripts({
                            build: 'tsc && tsc-alias',
                            start: 'node ./dist',
                            dev: devCommand
                        });
                        return { formatDevLoaders: formatDevLoaders, config: config };
                    }
                };
            }
        });
        taskBuilder.addTask({
            name: 'output',
            taskDependencies: { mainTask: mainTask },
            exports: { fastifyOutput: exports.fastifyOutputProvider },
            run: function (deps, _a) {
                var _b = _a.mainTask, formatDevLoaders = _b.formatDevLoaders, config = _b.config;
                return {
                    getProviders: function () {
                        return {
                            fastifyOutput: {
                                getDevLoaderString: function () {
                                    return formatDevLoaders(config.get('devLoaders') || []);
                                }
                            }
                        };
                    },
                    build: function () { }
                };
            }
        });
    }
});
exports["default"] = FastifyGenerator;
