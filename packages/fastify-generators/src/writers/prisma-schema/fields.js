"use strict";
exports.__esModule = true;
exports.buildPrismaScalarField = exports.PRISMA_SCALAR_FIELD_TYPES = void 0;
var change_case_1 = require("change-case");
var zod_1 = require("zod");
var string_1 = require("@src/utils/string");
function createConfig(config) {
    return config;
}
function createConfigMap(configMap) {
    return configMap;
}
exports.PRISMA_SCALAR_FIELD_TYPES = createConfigMap({
    string: createConfig({
        prismaType: 'String',
        optionsSchema: zod_1.z.object({
            "default": zod_1.z.string().optional()
        }),
        getAttributes: function (config) {
            if (config === null || config === void 0 ? void 0 : config["default"]) {
                return [{ name: '@default', args: [(0, string_1.doubleQuot)(config["default"])] }];
            }
            return [];
        }
    }),
    int: {
        prismaType: 'Int',
        optionsSchema: zod_1.z.object({
            "default": zod_1.z.string().optional()
        }),
        getAttributes: function (config) {
            if (config === null || config === void 0 ? void 0 : config["default"]) {
                return [{ name: '@default', args: [config["default"]] }];
            }
            return [];
        }
    },
    float: {
        prismaType: 'Float',
        optionsSchema: zod_1.z.object({
            "default": zod_1.z.string().optional()
        }),
        getAttributes: function (config) {
            if (config === null || config === void 0 ? void 0 : config["default"]) {
                return [{ name: '@default', args: [config["default"]] }];
            }
            return [];
        }
    },
    decimal: { prismaType: 'Decimal' },
    boolean: {
        prismaType: 'Boolean',
        optionsSchema: zod_1.z.object({
            "default": zod_1.z.string().optional()
        }),
        getAttributes: function (config) {
            if (config === null || config === void 0 ? void 0 : config["default"]) {
                return [{ name: '@default', args: [config["default"]] }];
            }
            return [];
        }
    },
    json: { prismaType: 'Json' },
    uuid: createConfig({
        prismaType: 'String',
        optionsSchema: zod_1.z.object({
            autoGenerate: zod_1.z.boolean().optional()
        }),
        getAttributes: function (config) {
            var attributes = [{ name: '@db.Uuid' }];
            if (config === null || config === void 0 ? void 0 : config.autoGenerate) {
                attributes.push({
                    name: '@default',
                    args: ['dbgenerated("gen_random_uuid()")']
                });
            }
            return attributes;
        }
    }),
    dateTime: createConfig({
        prismaType: 'DateTime',
        optionsSchema: zod_1.z.object({
            defaultToNow: zod_1.z.boolean().optional(),
            updatedAt: zod_1.z.boolean().optional()
        }),
        getAttributes: function (config) {
            var attributes = [
                { name: '@db.Timestamptz', args: ['3'] },
            ];
            if (config === null || config === void 0 ? void 0 : config.defaultToNow) {
                attributes.push({
                    name: '@default',
                    args: ['now()']
                });
            }
            if (config === null || config === void 0 ? void 0 : config.updatedAt) {
                attributes.push({
                    name: '@updatedAt'
                });
            }
            return attributes;
        }
    }),
    date: createConfig({
        prismaType: 'DateTime',
        optionsSchema: zod_1.z.object({
            defaultToNow: zod_1.z.boolean().optional()
        }),
        getAttributes: function (config) {
            var attributes = [{ name: '@db.Date' }];
            if (config === null || config === void 0 ? void 0 : config.defaultToNow) {
                attributes.push({
                    name: '@default',
                    args: ['now()']
                });
            }
            return attributes;
        }
    }),
    "enum": createConfig({
        prismaType: ''
    })
});
function buildPrismaScalarField(name, type, options) {
    var _a;
    var typeConfig = exports.PRISMA_SCALAR_FIELD_TYPES[type];
    if (!typeConfig) {
        throw new Error("Invalid type ".concat(type));
    }
    var _b = options || {}, id = _b.id, unique = _b.unique, optional = _b.optional, _c = _b.dbName, dbName = _c === void 0 ? (0, change_case_1.snakeCase)(name) : _c, typeOptions = _b.typeOptions, enumType = _b.enumType;
    var attributes = [];
    if (id) {
        attributes.push({ name: '@id' });
    }
    if (unique) {
        attributes.push({ name: '@unique' });
    }
    if (name !== dbName) {
        attributes.push({ name: '@map', args: ["\"".concat(dbName, "\"")] });
    }
    attributes.push.apply(attributes, (((_a = typeConfig.getAttributes) === null || _a === void 0 ? void 0 : _a.call(typeConfig, typeOptions)) ||
        []));
    var prismaType = type === 'enum' ? enumType : typeConfig.prismaType;
    if (!prismaType) {
        throw new Error("Prisma type required ".concat(type));
    }
    return {
        name: name,
        type: "".concat(prismaType).concat(optional ? '?' : ''),
        attributes: attributes,
        fieldType: 'scalar',
        scalarType: type,
        enumType: enumType
    };
}
exports.buildPrismaScalarField = buildPrismaScalarField;
