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
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var string_1 = require("@src/utils/string");
var prisma_model_1 = require("../prisma-model");
var REFERENTIAL_ACTIONS = [
    'Cascade',
    'Restrict',
    'NoAction',
    'SetNull',
    'SetDefault',
];
var descriptorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    fields: zod_1.z.array(zod_1.z.string().min(1)),
    references: zod_1.z.array(zod_1.z.string().min(1)),
    modelRef: zod_1.z.string().min(1),
    foreignRelationName: zod_1.z.string().optional(),
    relationshipName: zod_1.z.string().optional(),
    relationshipType: zod_1.z["enum"](['oneToOne', 'oneToMany'])["default"]('oneToMany'),
    optional: zod_1.z.boolean()["default"](false),
    onDelete: zod_1.z["enum"](REFERENTIAL_ACTIONS)["default"]('Cascade'),
    onUpdate: zod_1.z["enum"](REFERENTIAL_ACTIONS)["default"]('Restrict')
});
var PrismaRelationFieldGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        prismaModel: prisma_model_1.prismaModelProvider,
        foreignModel: prisma_model_1.prismaModelProvider
    },
    populateDependencies: function (deps, _a) {
        var modelRef = _a.modelRef;
        return (__assign(__assign({}, deps), { foreignModel: deps.foreignModel.dependency().reference(modelRef) }));
    },
    createGenerator: function (descriptor, _a) {
        var _this = this;
        var prismaModel = _a.prismaModel, foreignModel = _a.foreignModel;
        var name = descriptor.name, fields = descriptor.fields, references = descriptor.references, foreignRelationName = descriptor.foreignRelationName, relationshipName = descriptor.relationshipName, relationshipType = descriptor.relationshipType, optional = descriptor.optional, onDelete = descriptor.onDelete, onUpdate = descriptor.onUpdate;
        var isManyToOne = relationshipType === 'oneToMany';
        var modelName = foreignModel.getName();
        prismaModel.addField({
            name: name,
            type: "".concat(modelName).concat(optional ? '?' : ''),
            fieldType: 'relation',
            attributes: [
                {
                    name: '@relation',
                    args: __spreadArray(__spreadArray([], (relationshipName ? [(0, string_1.doubleQuot)(relationshipName)] : []), true), [
                        {
                            fields: fields,
                            references: references,
                            onDelete: onDelete,
                            onUpdate: onUpdate
                        },
                    ], false)
                },
            ]
        });
        if (foreignRelationName) {
            foreignModel.addField({
                name: foreignRelationName,
                type: "".concat(prismaModel.getName()).concat(isManyToOne ? '[]' : '?'),
                fieldType: 'relation',
                attributes: relationshipName
                    ? [{ name: '@relation', args: [(0, string_1.doubleQuot)(relationshipName)] }]
                    : []
            });
        }
        return {
            build: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); }
        };
    }
});
exports["default"] = PrismaRelationFieldGenerator;
