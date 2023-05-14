"use strict";
exports.__esModule = true;
exports.prismaFieldProvider = void 0;
var sync_1 = require("@baseplate/sync");
var zod_1 = require("zod");
var fields_1 = require("@src/writers/prisma-schema/fields");
var prisma_model_1 = require("../prisma-model");
// some typescript hacking to make field types work generically
var prismaScalarFieldTypes = fields_1.PRISMA_SCALAR_FIELD_TYPES;
var descriptorSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1),
    dbName: zod_1.z.string().optional(),
    type: zod_1.z["enum"](Object.keys(prismaScalarFieldTypes)),
    options: zod_1.z.object({}).catchall(zod_1.z.any()).optional(),
    id: zod_1.z.boolean().optional(),
    unique: zod_1.z.boolean().optional(),
    optional: zod_1.z.boolean().optional(),
    enumType: zod_1.z.string().optional()
})
    .superRefine(function (obj, ctx) {
    var _a;
    // TODO: Clean up
    var schema = (_a = prismaScalarFieldTypes[obj.type]) === null || _a === void 0 ? void 0 : _a.optionsSchema;
    if (schema) {
        var parseResult = schema.safeParse(obj.options || {});
        if (!parseResult.success) {
            ctx.addIssue(parseResult.error.errors[0]);
        }
    }
    return obj;
});
exports.prismaFieldProvider = (0, sync_1.createProviderType)('prisma-field');
var PrismaFieldGenerator = (0, sync_1.createGeneratorWithChildren)({
    descriptorSchema: descriptorSchema,
    getDefaultChildGenerators: function () { return ({}); },
    dependencies: {
        prismaModel: prisma_model_1.prismaModelProvider
    },
    exports: {
        prismaField: exports.prismaFieldProvider
    },
    createGenerator: function (descriptor, _a) {
        var prismaModel = _a.prismaModel;
        var name = descriptor.name, type = descriptor.type, id = descriptor.id, unique = descriptor.unique, options = descriptor.options, optional = descriptor.optional, dbName = descriptor.dbName, enumType = descriptor.enumType;
        if (type === 'enum' && !enumType) {
            throw new Error("Enum type required");
        }
        if (enumType && type !== 'enum') {
            throw new Error("Enum type can only be used with type 'enum'");
        }
        var prismaField = (0, fields_1.buildPrismaScalarField)(name, type, {
            id: id,
            unique: unique,
            optional: optional,
            dbName: dbName,
            typeOptions: options,
            enumType: enumType
        });
        prismaModel.addField(prismaField);
        return {
            getProviders: function () { return ({
                prismaField: {}
            }); },
            build: function () { }
        };
    }
});
exports["default"] = PrismaFieldGenerator;
