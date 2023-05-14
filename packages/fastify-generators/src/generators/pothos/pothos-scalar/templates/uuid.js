"use strict";
exports.__esModule = true;
exports.UuidScalar = void 0;
// @ts-nocheck
var graphql_1 = require("graphql");
var _pothos_1 = require("%pothos");
var uuid_1 = require("uuid");
var _http_errors_1 = require("%http-errors");
function parseUuid(value) {
    if (!(0, uuid_1.validate)(value)) {
        throw new Error("\"".concat(value, "\" is not a valid UUID"));
    }
    return value;
}
exports.UuidScalar = _pothos_1.builder.scalarType('Uuid', {
    description: 'Scalar representing a UUID',
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
        throw new _http_errors_1.BadRequestError('Uuid field must be provided as a string');
    }
});
