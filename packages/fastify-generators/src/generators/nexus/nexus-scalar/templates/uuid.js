"use strict";
exports.__esModule = true;
exports.UuidScalar = void 0;
// @ts-nocheck
var graphql_1 = require("graphql");
var nexus_1 = require("nexus");
var uuid_1 = require("uuid");
var _http_errors_1 = require("%http-errors");
function parseUuid(value) {
    if (!(0, uuid_1.validate)(value)) {
        throw new Error("\"".concat(value, "\" is not a valid UUID"));
    }
    return value;
}
exports.UuidScalar = (0, nexus_1.scalarType)({
    name: 'Uuid',
    asNexusMethod: 'uuid',
    description: 'UUID custom scalar type',
    sourceType: 'string',
    parseValue: function (value) {
        if (typeof value === 'string') {
            return parseUuid(value);
        }
        throw new _http_errors_1.BadRequestError('Uuid field must be provided as a string');
    },
    serialize: function (value) {
        if (typeof value === 'string') {
            return parseUuid(value);
        }
        throw new _http_errors_1.BadRequestError('Uuid field must be provided as a string');
    },
    parseLiteral: function (ast) {
        if (ast.kind === graphql_1.Kind.STRING) {
            return parseUuid(ast.value);
        }
        return null;
    }
});
