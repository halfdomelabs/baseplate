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
exports.PrismaSchemaFile = exports.createPrismaSchemaDatasourceBlock = exports.createPrismaSchemaGeneratorBlock = void 0;
/* eslint-disable max-classes-per-file */
var indent_string_1 = require("indent-string");
var ramda_1 = require("ramda");
function formatBlock(block) {
    return "\n".concat(block.type, " ").concat(block.name, " {\n").concat((0, indent_string_1["default"])(block.contents, 2), "\n}\n").trim();
}
function mapObjectToContents(obj) {
    return Object.keys(obj)
        .map(function (key) { return "".concat(key, " = ").concat(obj[key]); })
        .join('\n');
}
function createPrismaSchemaGeneratorBlock(_a) {
    var name = _a.name, provider = _a.provider, additionalOptions = _a.additionalOptions;
    return {
        name: name,
        type: 'generator',
        contents: mapObjectToContents(__assign(__assign({}, additionalOptions), { provider: "\"".concat(provider, "\"") }))
    };
}
exports.createPrismaSchemaGeneratorBlock = createPrismaSchemaGeneratorBlock;
function printEnumBlock(block) {
    return {
        type: 'enum',
        name: block.name,
        contents: block.values.map(function (v) { return v.name; }).join('\n')
    };
}
function createPrismaSchemaDatasourceBlock(_a) {
    var name = _a.name, provider = _a.provider, url = _a.url;
    return {
        name: name,
        type: 'datasource',
        contents: mapObjectToContents({
            provider: "\"".concat(provider, "\""),
            url: url
        })
    };
}
exports.createPrismaSchemaDatasourceBlock = createPrismaSchemaDatasourceBlock;
var PrismaSchemaFile = /** @class */ (function () {
    function PrismaSchemaFile() {
        this.generatorBlocks = [];
        this.datasourceBlock = null;
        this.modelBlockWriters = [];
        this.enums = [];
    }
    PrismaSchemaFile.prototype.addGeneratorBlock = function (block) {
        this.generatorBlocks.push(block);
    };
    PrismaSchemaFile.prototype.setDatasourceBlock = function (block) {
        this.datasourceBlock = block;
    };
    PrismaSchemaFile.prototype.addModelWriter = function (block) {
        if (this.modelBlockWriters.some(function (b) { return b.name === block.name; })) {
            throw new Error("Duplicate model name: ".concat(block.name));
        }
        this.modelBlockWriters.push(block);
    };
    PrismaSchemaFile.prototype.addEnum = function (block) {
        if (this.enums.some(function (b) { return b.name === block.name; })) {
            throw new Error("Duplicate enum name: ".concat(block.name));
        }
        this.enums.push(block);
    };
    PrismaSchemaFile.prototype.getModelBlock = function (name) {
        var _a;
        return (_a = this.modelBlockWriters
            .find(function (block) { return block.name === name; })) === null || _a === void 0 ? void 0 : _a.toOutputModel();
    };
    PrismaSchemaFile.prototype.getEnum = function (name) {
        return this.enums.find(function (block) { return block.name === name; });
    };
    PrismaSchemaFile.prototype.toText = function () {
        if (!this.datasourceBlock) {
            throw new Error("Datasource block required");
        }
        var modelBlocks = this.modelBlockWriters.map(function (b) { return b.toBlock(); });
        var enumBlocks = this.enums.map(function (block) { return printEnumBlock(block); });
        var sortedBlocks = ramda_1["default"].sortBy(ramda_1["default"].prop('name'), __spreadArray(__spreadArray([], modelBlocks, true), enumBlocks, true));
        return "".concat(__spreadArray(__spreadArray(__spreadArray([], this.generatorBlocks.map(formatBlock), true), [
            formatBlock(this.datasourceBlock)
        ], false), sortedBlocks.map(formatBlock), true).join('\n\n'), "\n");
    };
    return PrismaSchemaFile;
}());
exports.PrismaSchemaFile = PrismaSchemaFile;
