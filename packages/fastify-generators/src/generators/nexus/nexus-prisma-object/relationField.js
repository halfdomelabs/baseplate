"use strict";
exports.__esModule = true;
exports.writeObjectTypeRelationField = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var ramda_1 = require("ramda");
var nexus_definition_1 = require("@src/writers/nexus-definition");
function getResolverForField(field, model, prismaOutput) {
    if (!field.fields || !field.references) {
        if (!model.idFields) {
            throw new Error('ID field required for relations');
        }
        // resolver where the ID scalar field lives on foreign model
        var RESOLVER_TEMPLATE_1 = "\n  (INPUT) => MODEL.findUnique({ where: WHERE_CLAUSE }).RELATION_NAME()\n  ".trim();
        return core_generators_1.TypescriptCodeUtils.formatExpression(RESOLVER_TEMPLATE_1, {
            INPUT: "{".concat(model.idFields.join(', '), "}"),
            MODEL: prismaOutput.getPrismaModelExpression(model.name),
            WHERE_CLAUSE: "{".concat(model.idFields.join(', '), "}"),
            RELATION_NAME: field.name
        });
    }
    // resolver where the ID scalar field lives on foreign model
    //  TODO: Support optional field IDs
    var RESOLVER_TEMPLATE = "\n  (INPUT) => OPTIONAL_CHECK MODEL.findUniqueOrThrow({ where: WHERE_CLAUSE })\n  ".trim();
    if (field.fields.length !== field.references.length || !field.fields.length) {
        throw new Error('Fields and references must be the same length > 0');
    }
    return core_generators_1.TypescriptCodeUtils.formatExpression(RESOLVER_TEMPLATE, {
        INPUT: "{".concat(field.fields.join(', '), "}"),
        MODEL: prismaOutput.getPrismaModelExpression(field.modelType),
        OPTIONAL_CHECK: field.isOptional
            ? "".concat(field.fields.map(function (f) { return "".concat(f, " == null"); }).join(' || '), " ? null : ")
            : '',
        WHERE_CLAUSE: core_generators_1.TypescriptCodeUtils.mergeExpressionsAsObject(ramda_1["default"].mergeAll(field.fields.map(function (localName, index) {
            var _a;
            return (_a = {},
                _a[(field.references || [])[index]] = localName,
                _a);
        }))),
        RELATION_NAME: field.name
    });
}
function writeObjectTypeRelationField(field, model, _a) {
    var prismaOutput = _a.prismaOutput, writerOptions = _a.writerOptions;
    var prismaField = model.fields.find(function (f) { return f.name === field.name; });
    if ((prismaField === null || prismaField === void 0 ? void 0 : prismaField.type) !== 'relation') {
        throw new Error("Relation field ".concat(field.name, " not found in model ").concat(model.name));
    }
    return (0, nexus_definition_1.writeNexusObjectTypeFieldFromDtoNestedField)(field, getResolverForField(prismaField, model, prismaOutput), writerOptions);
}
exports.writeObjectTypeRelationField = writeObjectTypeRelationField;
