"use strict";
// @ts-nocheck
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.destroyTestDatabase = exports.createTestDatabase = exports.getTestPrisma = exports.replaceDatabase = void 0;
var child_process_1 = require("child_process");
var path_1 = require("path");
var client_1 = require("@prisma/client");
var pg_connection_string_1 = require("pg-connection-string");
var TEST_DATABASE_NAME = 'TEST_DATABASE_NAME_VALUE';
function replaceDatabase(connectionString, database) {
    var _a = (0, pg_connection_string_1.parse)(connectionString), host = _a.host, _b = _a.user, user = _b === void 0 ? '' : _b, _c = _a.password, password = _c === void 0 ? '' : _c, port = _a.port;
    return "postgresql://".concat(user || '', ":").concat(password || '', "@").concat(host || '', ":").concat(port || 5432, "/").concat(database);
}
exports.replaceDatabase = replaceDatabase;
function getTestPrisma(databaseUrl) {
    return new client_1.PrismaClient({
        datasources: { db: { url: databaseUrl } }
    });
}
exports.getTestPrisma = getTestPrisma;
function createTestDatabase(databaseUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var prismaClient, testDatabaseUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prismaClient = getTestPrisma(databaseUrl);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 4, 6]);
                    return [4 /*yield*/, prismaClient.$executeRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["DROP DATABASE IF EXISTS ", ""], ["DROP DATABASE IF EXISTS ", ""])), client_1.Prisma.raw(TEST_DATABASE_NAME))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prismaClient.$executeRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["CREATE DATABASE ", ""], ["CREATE DATABASE ", ""])), client_1.Prisma.raw(TEST_DATABASE_NAME))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, prismaClient.$disconnect()];
                case 5:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 6:
                    testDatabaseUrl = replaceDatabase(databaseUrl, TEST_DATABASE_NAME);
                    (0, child_process_1.execSync)('yarn prisma migrate deploy', {
                        cwd: path_1["default"].resolve(__dirname, '../../../'),
                        env: __assign(__assign({}, process.env), { DATABASE_URL: testDatabaseUrl })
                    });
                    return [2 /*return*/, testDatabaseUrl];
            }
        });
    });
}
exports.createTestDatabase = createTestDatabase;
function destroyTestDatabase(databaseUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var prismaClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prismaClient = getTestPrisma(databaseUrl);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 5]);
                    return [4 /*yield*/, prismaClient.$executeRaw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["DROP DATABASE IF EXISTS ", ""], ["DROP DATABASE IF EXISTS ", ""])), client_1.Prisma.raw(TEST_DATABASE_NAME))];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, prismaClient.$disconnect()];
                case 4:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.destroyTestDatabase = destroyTestDatabase;
var templateObject_1, templateObject_2, templateObject_3;
