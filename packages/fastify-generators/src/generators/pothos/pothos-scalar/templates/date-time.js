"use strict";
exports.__esModule = true;
exports.DateTimeScalar = void 0;
// @ts-nocheck
var graphql_1 = require("graphql");
var _pothos_1 = require("%pothos");
var _http_errors_1 = require("%http-errors");
exports.DateTimeScalar = _pothos_1.builder.scalarType('DateTime', {
    description: 'Scalar with date and time information',
    parseValue: function (value) {
        if (typeof value === 'string') {
            return new Date(value);
        }
        throw new _http_errors_1.BadRequestError('DateTime field must be provided as a string');
    },
    serialize: function (value) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (typeof value === 'string') {
            return new Date(value).toISOString();
        }
        throw new _http_errors_1.BadRequestError('DateTime field must be provided as a Date object or string');
    },
    parseLiteral: function (ast) {
        if (ast.kind === graphql_1.Kind.STRING) {
            return new Date(ast.value);
        }
        throw new _http_errors_1.BadRequestError('DateTime field must be provided as a string');
    }
});
