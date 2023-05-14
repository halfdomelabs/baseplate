"use strict";
exports.__esModule = true;
exports.authContextProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var request_service_context_1 = require("@src/generators/core/request-service-context");
var service_context_1 = require("@src/generators/core/service-context");
var auth_service_1 = require("../auth-service");
var descriptorSchema = zod_1.z.object({
    authInfoRef: zod_1.z.string().min(1)
});
exports.authContextProvider = (0, sync_1.createProviderType)('auth-context');
var createMainTask = (0, sync_1.createTaskConfigBuilder)(function (_a) {
    var authInfoRef = _a.authInfoRef;
    return ({
        name: 'main',
        dependencies: {
            serviceContextSetup: service_context_1.serviceContextSetupProvider,
            requestServiceContextSetup: request_service_context_1.requestServiceContextSetupProvider,
            authInfoImport: auth_service_1.authInfoImportProvider
                .dependency()
                .reference(authInfoRef)
        },
        exports: {
            authContext: exports.authContextProvider
        },
        run: function (_a) {
            var serviceContextSetup = _a.serviceContextSetup, requestServiceContextSetup = _a.requestServiceContextSetup, authInfoImport = _a.authInfoImport;
            return {
                getProviders: function () { return ({
                    authContext: {}
                }); },
                build: function () {
                    var authInfoType = core_generators_1.TypescriptCodeUtils.createExpression('AuthInfo', 'import { AuthInfo } from "%auth-info";', {
                        importMappers: [authInfoImport]
                    });
                    serviceContextSetup.addContextField('auth', {
                        type: authInfoType,
                        value: core_generators_1.TypescriptCodeUtils.createExpression('auth'),
                        contextArg: [
                            {
                                name: 'auth',
                                type: authInfoType,
                                // TODO: Figure out how to allow role service to inject test default here
                                testDefault: core_generators_1.TypescriptCodeUtils.createExpression('createAuthInfoFromUser(null, ["system"])', 'import { createAuthInfoFromUser } from "%auth-info";', { importMappers: [authInfoImport] })
                            },
                        ]
                    });
                    requestServiceContextSetup.addContextPassthrough({
                        name: 'auth',
                        creator: function (req) {
                            return core_generators_1.TypescriptCodeUtils.createExpression("".concat(req, ".auth"));
                        }
                    });
                }
            };
        }
    });
});
var AuthContextGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        taskBuilder.addTask(createMainTask(descriptor));
    }
});
exports["default"] = AuthContextGenerator;
