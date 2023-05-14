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
exports.authProvider = exports.authSetupProvider = void 0;
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var descriptorSchema = zod_1.z.object({});
exports.authSetupProvider = (0, sync_1.createProviderType)('auth-setup');
exports.authProvider = (0, sync_1.createProviderType)('auth', {
    isReadOnly: true
});
var AuthGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder) {
        var setupTask = taskBuilder.addTask({
            name: 'setup',
            exports: {
                authSetup: exports.authSetupProvider
            },
            run: function () {
                var config = (0, sync_1.createNonOverwriteableMap)({}, { name: 'auth-config' });
                return {
                    getProviders: function () { return ({
                        authSetup: {
                            getConfig: function () { return config; }
                        }
                    }); },
                    build: function () { return ({ config: config }); }
                };
            }
        });
        taskBuilder.addTask({
            name: 'main',
            exports: {
                auth: exports.authProvider
            },
            taskDependencies: { setupTask: setupTask },
            run: function (deps, _a) {
                var config = _a.setupTask.config;
                return {
                    getProviders: function () { return ({
                        auth: {
                            getConfig: function () { return config.value(); },
                            getImportMap: function () {
                                var roleServiceImport = config.value().roleServiceImport;
                                return __assign({}, (roleServiceImport
                                    ? { '%role-service': roleServiceImport }
                                    : {}));
                            }
                        }
                    }); }
                };
            }
        });
    }
});
exports["default"] = AuthGenerator;
