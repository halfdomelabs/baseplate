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
exports.createOneToManyUpsertData = exports.createOneToManyCreateData = void 0;
var arrays_1 = require("%ts-utils/arrays");
var data_pipes_1 = require("../data-pipes");
function createOneToManyCreateData(_a) {
    var input = _a.input, context = _a.context, transform = _a.transform;
    return __awaiter(this, void 0, void 0, function () {
        function transformCreateInput(item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, transform
                            ? transform(item, context)
                            : {
                                data: { create: item, update: item }
                            }];
                });
            });
        }
        var createOutputs;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!input) {
                        return [2 /*return*/, { data: undefined, operations: {} }];
                    }
                    return [4 /*yield*/, Promise.all(input.map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                            var output;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, transformCreateInput(item)];
                                    case 1:
                                        output = _a.sent();
                                        return [2 /*return*/, {
                                                data: output.data.create,
                                                operations: output.operations
                                            }];
                                }
                            });
                        }); }))];
                case 1:
                    createOutputs = _b.sent();
                    return [2 /*return*/, {
                            data: { create: createOutputs.map(function (output) { return output.data; }) },
                            operations: (0, data_pipes_1.mergePipeOperations)(createOutputs)
                        }];
            }
        });
    });
}
exports.createOneToManyCreateData = createOneToManyCreateData;
function createOneToManyUpsertData(_a) {
    var input = _a.input, idField = _a.idField, context = _a.context, getWhereUnique = _a.getWhereUnique, transform = _a.transform, parentId = _a.parentId;
    return __awaiter(this, void 0, void 0, function () {
        function transformCreateInput(item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, transform
                            ? transform(item, context, undefined, parentId)
                            : {
                                data: { create: item, update: item }
                            }];
                });
            });
        }
        function transformUpsertInput(item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, transform
                            ? transform(item, context, getWhereUnique(item), parentId)
                            : {
                                data: { create: item, update: item }
                            }];
                });
            });
        }
        var createOutputPromise, upsertOutputPromise, _b, upsertOutput, createOutput;
        var _c;
        var _this = this;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!input) {
                        return [2 /*return*/, { data: undefined, operations: {} }];
                    }
                    createOutputPromise = Promise.all(input
                        .filter(function (item) {
                        return item[idField] === undefined || getWhereUnique(item) === undefined;
                    })
                        .map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                        var output;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, transformCreateInput(item)];
                                case 1:
                                    output = _a.sent();
                                    return [2 /*return*/, {
                                            data: output.data.create,
                                            operations: output.operations
                                        }];
                            }
                        });
                    }); }));
                    upsertOutputPromise = Promise.all(input
                        .filter(function (item) { return item[idField] !== undefined && getWhereUnique(item); })
                        .map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                        var output;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, transformUpsertInput(item)];
                                case 1:
                                    output = _a.sent();
                                    return [2 /*return*/, {
                                            data: {
                                                where: getWhereUnique(item),
                                                create: output.data.create,
                                                update: output.data.update
                                            },
                                            operations: output.operations
                                        }];
                            }
                        });
                    }); }));
                    return [4 /*yield*/, Promise.all([
                            upsertOutputPromise,
                            createOutputPromise,
                        ])];
                case 1:
                    _b = _d.sent(), upsertOutput = _b[0], createOutput = _b[1];
                    return [2 /*return*/, {
                            data: {
                                deleteMany: idField &&
                                    (_c = {},
                                        _c[idField] = {
                                            notIn: input.map(function (data) { return data[idField]; }).filter(arrays_1.notEmpty)
                                        },
                                        _c),
                                upsert: upsertOutput.map(function (output) { return output.data; }),
                                create: createOutput.map(function (output) { return output.data; })
                            },
                            operations: (0, data_pipes_1.mergePipeOperations)(__spreadArray(__spreadArray([], upsertOutput, true), createOutput, true))
                        }];
            }
        });
    });
}
exports.createOneToManyUpsertData = createOneToManyUpsertData;
