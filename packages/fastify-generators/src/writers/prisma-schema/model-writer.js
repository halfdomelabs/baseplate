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
exports.PrismaModelBlockWriter = void 0;
function formatAttributeArgument(argument) {
    return Array.isArray(argument) ? "[".concat(argument.join(', '), "]") : argument;
}
function formatAttributeArguments(args) {
    var argStrings = typeof args === 'string'
        ? [args]
        : args.flatMap(function (argument) {
            if (typeof argument === 'string' || Array.isArray(argument)) {
                return formatAttributeArgument(argument);
            }
            return Object.keys(argument).map(function (key) { return "".concat(key, ": ").concat(formatAttributeArgument(argument[key])); });
        });
    return argStrings.join(', ');
}
function formatAttribute(_a) {
    var args = _a.args, name = _a.name;
    if (!args) {
        return name;
    }
    return "".concat(name, "(").concat(formatAttributeArguments(args), ")");
}
function parseArguments(attribute, positionalArgumentNames) {
    if (!attribute.args) {
        return {};
    }
    return attribute.args.reduce(function (argumentMap, arg, idx) {
        var _a;
        if (Array.isArray(arg) || typeof arg === 'string') {
            var argName = positionalArgumentNames[idx];
            if (!argName) {
                throw new Error("Must provide positional argument name for ".concat(attribute.name));
            }
            return __assign(__assign({}, argumentMap), (_a = {}, _a[argName] = arg, _a));
        }
        return __assign(__assign({}, argumentMap), arg);
    }, {});
}
function formatModel(_a) {
    var name = _a.name, type = _a.type, attributes = _a.attributes;
    return __spreadArray([name, type], ((attributes === null || attributes === void 0 ? void 0 : attributes.map(formatAttribute)) || []), true).join(' ');
}
var PrismaModelBlockWriter = /** @class */ (function () {
    function PrismaModelBlockWriter(options) {
        this.options = options;
        this.fields = [];
        this.attributes = [];
        this.name = options.name;
    }
    PrismaModelBlockWriter.prototype.addField = function (field) {
        this.fields.push(field);
        return this;
    };
    PrismaModelBlockWriter.prototype.addAttribute = function (attribute) {
        this.attributes.push(attribute);
        return this;
    };
    PrismaModelBlockWriter.prototype.extractIdFields = function () {
        var singleIdFields = this.fields.filter(function (field) { var _a; return (_a = field.attributes) === null || _a === void 0 ? void 0 : _a.some(function (attr) { return attr.name === '@id'; }); });
        if (singleIdFields.length > 1) {
            throw new Error("Model ".concat(this.name, " has more than one @id field"));
        }
        if (singleIdFields.length) {
            return singleIdFields.map(function (field) { return field.name; });
        }
        var idAttribute = this.attributes.find(function (attr) { return attr.name === '@@id'; });
        if (idAttribute) {
            var args = parseArguments(idAttribute, ['fields']);
            var fields = args.fields;
            return Array.isArray(fields) ? fields : [fields];
        }
        return null;
    };
    PrismaModelBlockWriter.prototype.toOutputModel = function () {
        return {
            name: this.options.name,
            fields: this.fields.map(function (field) {
                var _a, _b, _c;
                var sharedFields = {
                    name: field.name,
                    id: ((_a = field.attributes) === null || _a === void 0 ? void 0 : _a.some(function (attr) { return attr.name === '@id'; })) || false,
                    isOptional: field.type.endsWith('?'),
                    isList: /\[\]\??$/.test(field.type),
                    hasDefault: ((_b = field.attributes) === null || _b === void 0 ? void 0 : _b.some(function (attr) { return attr.name === '@default'; })) || false
                };
                if (field.fieldType === 'relation') {
                    var relationAttribute = (_c = field.attributes) === null || _c === void 0 ? void 0 : _c.find(function (attr) { return attr.name === '@relation'; });
                    var _d = relationAttribute
                        ? parseArguments(relationAttribute, ['name'])
                        : {}, relationName = _d.name, fields = _d.fields, references = _d.references;
                    if (Array.isArray(relationName)) {
                        throw new Error('Relation name must be string');
                    }
                    if (typeof fields === 'string' || typeof references === 'string') {
                        throw new Error('Fields and references must be arrays');
                    }
                    return __assign({ type: 'relation', modelType: field.type.replace(/[[\]?]+$/g, ''), relationName: relationName, fields: fields, references: references }, sharedFields);
                }
                if (!field.scalarType) {
                    throw new Error('Scalar type not set for scalar field');
                }
                return __assign({ type: 'scalar', scalarType: field.scalarType, enumType: field.enumType }, sharedFields);
            }),
            idFields: this.extractIdFields()
        };
    };
    PrismaModelBlockWriter.prototype.toBlock = function () {
        var attributes = __spreadArray([], this.attributes, true);
        if (this.options.tableName) {
            attributes.push({
                name: '@@map',
                args: ["\"".concat(this.options.tableName, "\"")]
            });
        }
        var fieldsString = this.fields.map(formatModel).join('\n');
        var modelAttributeString = attributes.map(formatAttribute).join('\n');
        return {
            name: this.options.name,
            type: 'model',
            contents: [fieldsString, modelAttributeString]
                .filter(function (x) { return x; })
                .join('\n\n')
        };
    };
    return PrismaModelBlockWriter;
}());
exports.PrismaModelBlockWriter = PrismaModelBlockWriter;
