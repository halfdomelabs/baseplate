"use strict";
// @ts-nocheck
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.applyDataPipeOutputWithoutOperation = exports.applyDataPipeOutput = exports.applyDataPipeOutputToOperations = exports.mergePipeOperations = void 0;
var _prisma_service_1 = require("%prisma-service");
var arrays_1 = require("%ts-utils/arrays");
function mergePipeOperations(outputs) {
    var operations = outputs
        .map(function (o) { return (o && 'data' in o ? o.operations : o); })
        .filter(arrays_1.notEmpty);
    return {
        beforePrismaPromises: operations.flatMap(function (op) { return op.beforePrismaPromises || []; }),
        afterPrismaPromises: operations.flatMap(function (op) { return op.afterPrismaPromises || []; })
    };
}
exports.mergePipeOperations = mergePipeOperations;
function applyDataPipeOutputToOperations(outputs, operations) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, beforePrismaPromises, _c, afterPrismaPromises, results;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = mergePipeOperations(outputs), _b = _a.beforePrismaPromises, beforePrismaPromises = _b === void 0 ? [] : _b, _c = _a.afterPrismaPromises, afterPrismaPromises = _c === void 0 ? [] : _c;
                    return [4 /*yield*/, _prisma_service_1.prisma.$transaction(__spreadArray(__spreadArray(__spreadArray([], beforePrismaPromises, true), operations, true), afterPrismaPromises, true))];
                case 1:
                    results = _d.sent();
                    return [2 /*return*/, results.slice(beforePrismaPromises.length, beforePrismaPromises.length + operations.length)];
            }
        });
    });
}
exports.applyDataPipeOutputToOperations = applyDataPipeOutputToOperations;
function applyDataPipeOutput(outputs, operation) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, beforePrismaPromises, _c, afterPrismaPromises, results;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = mergePipeOperations(outputs), _b = _a.beforePrismaPromises, beforePrismaPromises = _b === void 0 ? [] : _b, _c = _a.afterPrismaPromises, afterPrismaPromises = _c === void 0 ? [] : _c;
                    return [4 /*yield*/, _prisma_service_1.prisma.$transaction(__spreadArray(__spreadArray(__spreadArray([], beforePrismaPromises, true), [
                            operation
                        ], false), afterPrismaPromises, true))];
                case 1:
                    results = _d.sent();
                    return [2 /*return*/, results[beforePrismaPromises.length]];
            }
        });
    });
}
exports.applyDataPipeOutput = applyDataPipeOutput;
function applyDataPipeOutputWithoutOperation(outputs) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, beforePrismaPromises, _c, afterPrismaPromises;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = mergePipeOperations(outputs), _b = _a.beforePrismaPromises, beforePrismaPromises = _b === void 0 ? [] : _b, _c = _a.afterPrismaPromises, afterPrismaPromises = _c === void 0 ? [] : _c;
                    return [4 /*yield*/, _prisma_service_1.prisma.$transaction(__spreadArray(__spreadArray([], beforePrismaPromises, true), afterPrismaPromises, true))];
                case 1:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.applyDataPipeOutputWithoutOperation = applyDataPipeOutputWithoutOperation;
