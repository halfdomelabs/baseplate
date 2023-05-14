"use strict";
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
exports.__esModule = true;
exports.createNexusTypesFileTask = exports.nexusTypesFileProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var change_case_1 = require("change-case");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var root_module_1 = require("@src/generators/core/root-module");
var nexus_1 = require("../nexus");
var descriptorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    categoryOrder: zod_1.z.array(zod_1.z.string()).optional()
});
exports.nexusTypesFileProvider = (0, sync_1.createProviderType)('nexus-types-file');
exports.createNexusTypesFileTask = (0, sync_1.createTaskConfigBuilder)(function (_a) {
    var name = _a.name, categoryOrder = _a.categoryOrder;
    return ({
        name: 'nexus-types-file',
        dependencies: {
            appModule: root_module_1.appModuleProvider,
            typescript: core_generators_1.typescriptProvider,
            nexusSchema: nexus_1.nexusSchemaProvider
        },
        exports: {
            nexusTypes: exports.nexusTypesFileProvider
        },
        run: function (_a) {
            var _this = this;
            var appModule = _a.appModule, typescript = _a.typescript, nexusSchema = _a.nexusSchema;
            var typesPath = "".concat(appModule.getModuleFolder(), "/schema/").concat((0, change_case_1.paramCase)(name), ".ts");
            appModule.registerFieldEntry('schemaTypes', new core_generators_1.TypescriptCodeExpression(name, "import * as ".concat(name, " from '@/").concat(typesPath.replace(/\.ts$/, ''), "'")));
            nexusSchema.registerSchemaFile(typesPath);
            var registeredKeys = [];
            var types = [];
            return {
                getProviders: function () { return ({
                    nexusTypes: {
                        registerType: function (type) {
                            var typeName = type.name;
                            if (typeName) {
                                if (registeredKeys.includes(typeName)) {
                                    return;
                                }
                                var isSchemaTypeUnregistered = nexusSchema.registerSchemaType(typeName);
                                if (!isSchemaTypeUnregistered) {
                                    return;
                                }
                                registeredKeys.push(typeName);
                            }
                            types.push(type);
                        }
                    }
                }); },
                build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                    var orderedTypes, typesFile;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                orderedTypes = ramda_1["default"].sortBy(function (type) {
                                    if (!type.category || !(categoryOrder === null || categoryOrder === void 0 ? void 0 : categoryOrder.includes(type.category))) {
                                        return (categoryOrder || []).length;
                                    }
                                    return categoryOrder.indexOf(type.category);
                                }, types);
                                typesFile = typescript.createTemplate({
                                    TYPES: core_generators_1.TypescriptCodeUtils.mergeBlocks(orderedTypes.map(function (t) { return t.block; }), '\n\n')
                                });
                                return [4 /*yield*/, builder.apply(typesFile.renderToActionFromText('TYPES', typesPath))];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); }
            };
        }
    });
});
var NexusTypesFileGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        taskBuilder.addTask((0, exports.createNexusTypesFileTask)(descriptor));
    }
});
exports["default"] = NexusTypesFileGenerator;
