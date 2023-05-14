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
exports.createPothosEnumsFileTask = exports.pothosEnumsFileProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var change_case_1 = require("change-case");
var ramda_1 = require("ramda");
var zod_1 = require("zod");
var root_module_1 = require("@src/generators/core/root-module");
var pothos_1 = require("../pothos");
var descriptorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1)
});
exports.pothosEnumsFileProvider = (0, sync_1.createProviderType)('pothos-enums-file');
exports.createPothosEnumsFileTask = (0, sync_1.createTaskConfigBuilder)(function (_a) {
    var name = _a.name;
    return ({
        name: 'main',
        dependencies: {
            appModule: root_module_1.appModuleProvider,
            typescript: core_generators_1.typescriptProvider,
            pothosSetup: pothos_1.pothosSetupProvider
        },
        exports: {
            pothosEnumsFile: exports.pothosEnumsFileProvider
        },
        run: function (_a) {
            var _this = this;
            var appModule = _a.appModule, typescript = _a.typescript, pothosSetup = _a.pothosSetup;
            var _b = (0, core_generators_1.makeImportAndFilePath)("".concat(appModule.getModuleFolder(), "/schema/").concat((0, change_case_1.paramCase)(name), ".ts")), typesImport = _b[0], typesPath = _b[1];
            appModule.addModuleImport(typesImport);
            pothosSetup.registerSchemaFile(typesPath);
            var enums = [];
            return {
                getProviders: function () { return ({
                    pothosEnumsFile: {
                        getBuilder: function () { return 'builder'; },
                        registerEnum: function (pothosEnum) {
                            enums.push(pothosEnum);
                            pothosSetup.getTypeReferences().addPothosEnum({
                                typeName: pothosEnum.name,
                                exportName: pothosEnum.exportName,
                                moduleName: typesImport
                            });
                        }
                    }
                }); },
                build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                    var orderedTypes, enumsFile;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                orderedTypes = ramda_1["default"].sortBy(function (type) { return type.name; }, enums);
                                enumsFile = typescript.createTemplate({
                                    TYPES: core_generators_1.TypescriptCodeUtils.mergeBlocks(orderedTypes.map(function (t) { return t.block; }), '\n\n')
                                });
                                enumsFile.addCodeAddition({
                                    importText: ["import {builder} from '%pothos'"],
                                    importMappers: [pothosSetup]
                                });
                                return [4 /*yield*/, builder.apply(enumsFile.renderToActionFromText('TYPES', typesPath))];
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
var PothosEnumsFileGenerator = (0, sync_1.createGeneratorWithTasks)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    buildTasks: function (taskBuilder, descriptor) {
        taskBuilder.addTask((0, exports.createPothosEnumsFileTask)(descriptor));
    }
});
exports["default"] = PothosEnumsFileGenerator;
