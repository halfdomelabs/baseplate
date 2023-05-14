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
exports.prismaJestProvider = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var prisma_1 = require("@src/generators/prisma/prisma");
var fastify_jest_1 = require("../fastify-jest");
var descriptorSchema = zod_1.z.object({
    placeholder: zod_1.z.string().optional()
});
exports.prismaJestProvider = (0, sync_1.createProviderType)('prisma-jest');
var PrismaJestGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        node: core_generators_1.nodeProvider,
        jest: core_generators_1.jestProvider,
        typescript: core_generators_1.typescriptProvider,
        prismaOutput: prisma_1.prismaOutputProvider,
        project: core_generators_1.projectProvider,
        // TOOD: Figure out how to order fastify jest block before prisma custom setup block
        fastifyJest: fastify_jest_1.fastifyJestProvider
    },
    exports: {
        prismaJest: exports.prismaJestProvider
    },
    createGenerator: function (descriptor, _a) {
        var _this = this;
        var node = _a.node, jest = _a.jest, project = _a.project, typescript = _a.typescript, prismaOutput = _a.prismaOutput;
        node.addDevPackages({
            'jest-mock-extended': '^2.0.6',
            'pg-connection-string': '^2.5.0'
        });
        var _b = (0, core_generators_1.makeImportAndFilePath)('src/tests/helpers/db.test-helper.ts'), dbHelperImport = _b[0], dbHelperPath = _b[1];
        var _c = (0, core_generators_1.makeImportAndFilePath)('src/tests/helpers/prisma.test-helper.ts'), prismaHelperImport = _c[0], prismaHelperPath = _c[1];
        var importMap = {
            '%prisma-jest/db': {
                path: dbHelperImport,
                allowedImports: ['createTestDatabase', 'destroyTestDatabase']
            },
            '%prisma-jest/prisma': {
                path: prismaHelperImport,
                allowedImports: ['prismaMock']
            }
        };
        jest.getConfig().appendUnique('customSetupBlocks', [
            core_generators_1.TypescriptCodeUtils.createBlock("\n// don't run database set-up if only running unit tests\nif (!globalConfig.testPathPattern.includes('.unit.')) {\n  if (!process.env.DATABASE_URL) {\n    throw new Error('DATABASE_URL is not set');\n  }\n\n  // create separate test DB\n  const testDatabaseUrl = await createTestDatabase(process.env.DATABASE_URL);\n\n  // back up original database URL\n  process.env.ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;\n  process.env.DATABASE_URL = testDatabaseUrl;\n\n  console.log('\\nDatabase migrations ran!');\n}\n", ["import { createTestDatabase } from '%prisma-jest/db'"], { importMappers: [{ getImportMap: function () { return importMap; } }] }),
        ]);
        return {
            getProviders: function () { return ({
                prismaJest: {
                    getImportMap: function () { return importMap; }
                }
            }); },
            build: function (builder) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                source: 'db.test-helper.ts',
                                destination: dbHelperPath,
                                replacements: {
                                    TEST_DATABASE_NAME_VALUE: "".concat(project
                                        .getProjectName()
                                        .replace('-', '_'), "_test")
                                }
                            }))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, builder.apply(typescript.createCopyAction({
                                    source: 'prisma.test-helper.ts',
                                    destination: prismaHelperPath,
                                    importMappers: [prismaOutput],
                                    replacements: {
                                        PRISMA_SERVICE_PATH: typescript.resolveModule(prismaOutput.getPrismaServicePath(), prismaHelperPath)
                                    }
                                }))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        };
    }
});
exports["default"] = PrismaJestGenerator;
